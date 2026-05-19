"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoicesModule = void 0;
const stellar_sdk_1 = require("@stellar/stellar-sdk");
const stellar_sdk_2 = require("@stellar/stellar-sdk");
const errors_1 = require("../errors");
class InvoicesModule {
    constructor(rpcUrl, contractId) {
        this.rpcUrl = rpcUrl;
        this.contractId = contractId;
    }
    async create(params) {
        const server = new stellar_sdk_2.rpc.Server(this.rpcUrl);
        let account;
        try {
            account = await server.getAccount(params.keypair.publicKey());
        }
        catch {
            throw new errors_1.LedjaError('Failed to load account', errors_1.LedjaErrorCode.NetworkError);
        }
        const networkPassphrase = this.rpcUrl.includes('mainnet')
            ? stellar_sdk_1.Networks.PUBLIC
            : stellar_sdk_1.Networks.TESTNET;
        const contract = new stellar_sdk_1.Contract(this.contractId);
        const tx = new stellar_sdk_1.TransactionBuilder(account, {
            fee: stellar_sdk_1.BASE_FEE,
            networkPassphrase,
        })
            .addOperation(contract.call('create_invoice', (0, stellar_sdk_1.nativeToScVal)(stellar_sdk_1.Address.fromString(params.buyer), { type: 'address' }), (0, stellar_sdk_1.nativeToScVal)(params.amount, { type: 'i128' }), (0, stellar_sdk_1.nativeToScVal)(params.dueDate, { type: 'u64' })))
            .setTimeout(30)
            .build();
        let preparedTx;
        try {
            preparedTx = await server.prepareTransaction(tx);
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : 'Simulation failed';
            throw new errors_1.LedjaError(msg, errors_1.LedjaErrorCode.NetworkError);
        }
        preparedTx.sign(params.keypair);
        let sendResult;
        try {
            sendResult = await server.sendTransaction(preparedTx);
        }
        catch {
            throw new errors_1.LedjaError('Failed to submit transaction', errors_1.LedjaErrorCode.NetworkError);
        }
        if (sendResult.status === 'ERROR') {
            throw new errors_1.LedjaError('Contract call failed', errors_1.LedjaErrorCode.UnknownError);
        }
        // Poll for confirmation
        let getResult = await server.getTransaction(sendResult.hash);
        for (let i = 0; i < 10 && getResult.status === 'NOT_FOUND'; i++) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            getResult = await server.getTransaction(sendResult.hash);
        }
        if (getResult.status !== 'SUCCESS') {
            throw new errors_1.LedjaError(`Transaction ${getResult.status.toLowerCase()}`, errors_1.LedjaErrorCode.UnknownError);
        }
        const returnVal = getResult.returnValue;
        if (!returnVal) {
            throw new errors_1.LedjaError('No return value from contract', errors_1.LedjaErrorCode.UnknownError);
        }
        return returnVal.u32();
    }
    async get(id) {
        const server = new stellar_sdk_2.rpc.Server(this.rpcUrl);
        const key = (0, stellar_sdk_1.nativeToScVal)(id, { type: 'u32' });
        let ledgerEntry;
        try {
            ledgerEntry = await server.getContractData(this.contractId, key);
        }
        catch (error) {
            if (error instanceof stellar_sdk_1.NotFoundError ||
                (error instanceof Error && error.message.toLowerCase().includes('not found'))) {
                throw new errors_1.LedjaError(`Invoice ${id} not found`, errors_1.LedjaErrorCode.NotFound);
            }
            const message = error instanceof Error ? error.message : 'Failed to read invoice';
            throw new errors_1.LedjaError(message, errors_1.LedjaErrorCode.NetworkError);
        }
        const contractDataEntry = ledgerEntry.val.contractData();
        const invoiceValue = contractDataEntry.val();
        const invoice = InvoicesModule.parseInvoiceValue(invoiceValue, id);
        return invoice;
    }
    static parseInvoiceValue(value, id) {
        const mapEntries = value.map();
        if (mapEntries) {
            return this.parseInvoiceMap(mapEntries, id);
        }
        const vecEntries = value.vec();
        if (vecEntries) {
            return this.parseInvoiceVector(vecEntries, id);
        }
        throw new errors_1.LedjaError('Malformed invoice data', errors_1.LedjaErrorCode.UnknownError);
    }
    static parseInvoiceMap(entries, id) {
        const invoice = { id };
        for (const entry of entries) {
            const key = this.scValToString(entry.key());
            const value = entry.val();
            switch (key) {
                case 'seller':
                    invoice.seller = this.scValToAddress(value);
                    break;
                case 'buyer':
                    invoice.buyer = this.scValToAddress(value);
                    break;
                case 'amount':
                    invoice.amount = this.scValToBigInt(value);
                    break;
                case 'dueDate':
                case 'due_date':
                    invoice.dueDate = this.scValToNumber(value);
                    break;
                case 'status':
                    invoice.status = this.scValToStatus(value);
                    break;
                case 'id':
                    invoice.id = this.scValToNumber(value);
                    break;
            }
        }
        return this.completeInvoice(invoice, id);
    }
    static parseInvoiceVector(entries, id) {
        const cleanEntries = entries.filter((entry) => entry !== null);
        let index = 0;
        let resultId = id;
        if (cleanEntries.length === 6 && cleanEntries[0].switch().name.includes('scvU')) {
            resultId = this.scValToNumber(cleanEntries[0]);
            index = 1;
        }
        const seller = this.scValToAddress(cleanEntries[index++]);
        const buyer = this.scValToAddress(cleanEntries[index++]);
        const amount = this.scValToBigInt(cleanEntries[index++]);
        const dueDate = this.scValToNumber(cleanEntries[index++]);
        const status = this.scValToStatus(cleanEntries[index++]);
        return {
            id: resultId,
            seller,
            buyer,
            amount,
            dueDate,
            status,
        };
    }
    static scValToAddress(value) {
        if (value.switch().name === 'scvAddress') {
            return stellar_sdk_1.Address.fromScVal(value).toString();
        }
        const raw = this.scValToString(value);
        return stellar_sdk_1.Address.fromString(raw).toString();
    }
    static scValToString(value) {
        const type = value.switch().name;
        if (type === 'scvSymbol') {
            const symbol = value.sym();
            return typeof symbol === 'string' ? symbol : symbol.toString('utf8');
        }
        if (type === 'scvString') {
            const str = value.str();
            return typeof str === 'string' ? str : str.toString('utf8');
        }
        throw new errors_1.LedjaError('Expected string-like value', errors_1.LedjaErrorCode.UnknownError);
    }
    static scValToNumber(value) {
        const type = value.switch().name;
        if (type === 'scvU32' || type === 'scvI32') {
            return value.u32();
        }
        if (type === 'scvU64' || type === 'scvI64') {
            return Number(BigInt(value[type === 'scvU64' ? 'u64' : 'i64']().toString()));
        }
        throw new errors_1.LedjaError('Expected numeric value', errors_1.LedjaErrorCode.UnknownError);
    }
    static scValToBigInt(value) {
        const type = value.switch().name;
        if (type === 'scvU128' || type === 'scvI128') {
            const parts = type === 'scvU128' ? value.u128() : value.i128();
            const hi = BigInt(parts.hi().toString());
            const lo = BigInt(parts.lo().toString()) & ((1n << 64n) - 1n);
            return (hi << 64n) + lo;
        }
        if (type === 'scvU64' || type === 'scvI64') {
            return BigInt(value[type === 'scvU64' ? 'u64' : 'i64']().toString());
        }
        if (type === 'scvU32' || type === 'scvI32') {
            return BigInt(value.u32());
        }
        throw new errors_1.LedjaError('Expected integer value', errors_1.LedjaErrorCode.UnknownError);
    }
    static scValToStatus(value) {
        const raw = this.scValToString(value);
        const normalized = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
        if (normalized === 'Draft' || normalized === 'Issued' || normalized === 'Paid' || normalized === 'Overdue') {
            return normalized;
        }
        throw new errors_1.LedjaError('Invalid invoice status', errors_1.LedjaErrorCode.UnknownError);
    }
    static completeInvoice(invoice, fallbackId) {
        if (invoice.seller === undefined ||
            invoice.buyer === undefined ||
            invoice.amount === undefined ||
            invoice.dueDate === undefined ||
            invoice.status === undefined) {
            throw new errors_1.LedjaError('Incomplete invoice data', errors_1.LedjaErrorCode.UnknownError);
        }
        return {
            id: invoice.id ?? fallbackId,
            seller: invoice.seller,
            buyer: invoice.buyer,
            amount: invoice.amount,
            dueDate: invoice.dueDate,
            status: invoice.status,
        };
    }
}
exports.InvoicesModule = InvoicesModule;
//# sourceMappingURL=invoices.js.map