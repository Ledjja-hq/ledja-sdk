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
}
exports.InvoicesModule = InvoicesModule;
//# sourceMappingURL=invoices.js.map