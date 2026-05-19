import {
  Keypair,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  Address,
  Contract,
  NotFoundError,
  xdr,
} from '@stellar/stellar-sdk';
import { rpc as SorobanRpc } from '@stellar/stellar-sdk';
import { LedjaError, LedjaErrorCode } from '../errors';
import type { Invoice, InvoiceStatus } from '../types';

export interface CreateInvoiceParams {
  buyer: string;
  amount: bigint;
  dueDate: number; // Unix timestamp
  keypair: Keypair;
}

export class InvoicesModule {
  private readonly rpcUrl: string;
  private readonly contractId: string;

  constructor(rpcUrl: string, contractId: string) {
    this.rpcUrl = rpcUrl;
    this.contractId = contractId;
  }

  async create(params: CreateInvoiceParams): Promise<number> {
    const server = new SorobanRpc.Server(this.rpcUrl);

    let account;
    try {
      account = await server.getAccount(params.keypair.publicKey());
    } catch {
      throw new LedjaError('Failed to load account', LedjaErrorCode.NetworkError);
    }

    const networkPassphrase = this.rpcUrl.includes('mainnet')
      ? Networks.PUBLIC
      : Networks.TESTNET;

    const contract = new Contract(this.contractId);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        contract.call(
          'create_invoice',
          nativeToScVal(Address.fromString(params.buyer), { type: 'address' }),
          nativeToScVal(params.amount, { type: 'i128' }),
          nativeToScVal(params.dueDate, { type: 'u64' })
        )
      )
      .setTimeout(30)
      .build();

    let preparedTx;
    try {
      preparedTx = await server.prepareTransaction(tx);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Simulation failed';
      throw new LedjaError(msg, LedjaErrorCode.NetworkError);
    }

    preparedTx.sign(params.keypair);

    let sendResult;
    try {
      sendResult = await server.sendTransaction(preparedTx);
    } catch {
      throw new LedjaError('Failed to submit transaction', LedjaErrorCode.NetworkError);
    }

    if (sendResult.status === 'ERROR') {
      throw new LedjaError('Contract call failed', LedjaErrorCode.UnknownError);
    }

    // Poll for confirmation
    let getResult = await server.getTransaction(sendResult.hash);
    for (let i = 0; i < 10 && getResult.status === 'NOT_FOUND'; i++) {
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));
      getResult = await server.getTransaction(sendResult.hash);
    }

    if (getResult.status !== 'SUCCESS') {
      throw new LedjaError(
        `Transaction ${getResult.status.toLowerCase()}`,
        LedjaErrorCode.UnknownError
      );
    }

    const returnVal = (getResult as SorobanRpc.Api.GetSuccessfulTransactionResponse).returnValue;
    if (!returnVal) {
      throw new LedjaError('No return value from contract', LedjaErrorCode.UnknownError);
    }

    return returnVal.u32();
  }

  async get(id: number): Promise<Invoice> {
    const server = new SorobanRpc.Server(this.rpcUrl);
    const key = nativeToScVal(id, { type: 'u32' });

    let ledgerEntry;
    try {
      ledgerEntry = await server.getContractData(this.contractId, key);
    } catch (error: unknown) {
      if (error instanceof NotFoundError ||
          (error instanceof Error && error.message.toLowerCase().includes('not found'))
      ) {
        throw new LedjaError(`Invoice ${id} not found`, LedjaErrorCode.NotFound);
      }

      const message = error instanceof Error ? error.message : 'Failed to read invoice';
      throw new LedjaError(message, LedjaErrorCode.NetworkError);
    }

    const contractDataEntry = ledgerEntry.val.contractData();
    const invoiceValue = contractDataEntry.val();
    const invoice = InvoicesModule.parseInvoiceValue(invoiceValue, id);

    return invoice;
  }

  private static parseInvoiceValue(value: xdr.ScVal, id: number): Invoice {
    const mapEntries = value.map();
    if (mapEntries) {
      return this.parseInvoiceMap(mapEntries, id);
    }

    const vecEntries = value.vec();
    if (vecEntries) {
      return this.parseInvoiceVector(vecEntries, id);
    }

    throw new LedjaError('Malformed invoice data', LedjaErrorCode.UnknownError);
  }

  private static parseInvoiceMap(entries: xdr.ScMapEntry[], id: number): Invoice {
    const invoice: Partial<Invoice> = { id };

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

  private static parseInvoiceVector(entries: (xdr.ScVal | null)[], id: number): Invoice {
    const cleanEntries = entries.filter((entry): entry is xdr.ScVal => entry !== null);

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

  private static scValToAddress(value: xdr.ScVal): string {
    if (value.switch().name === 'scvAddress') {
      return Address.fromScVal(value).toString();
    }

    const raw = this.scValToString(value);
    return Address.fromString(raw).toString();
  }

  private static scValToString(value: xdr.ScVal): string {
    const type = value.switch().name;

    if (type === 'scvSymbol') {
      const symbol = value.sym();
      return typeof symbol === 'string' ? symbol : symbol.toString('utf8');
    }

    if (type === 'scvString') {
      const str = value.str();
      return typeof str === 'string' ? str : str.toString('utf8');
    }

    throw new LedjaError('Expected string-like value', LedjaErrorCode.UnknownError);
  }

  private static scValToNumber(value: xdr.ScVal): number {
    const type = value.switch().name;

    if (type === 'scvU32' || type === 'scvI32') {
      return value.u32();
    }

    if (type === 'scvU64' || type === 'scvI64') {
      return Number(BigInt(value[type === 'scvU64' ? 'u64' : 'i64']().toString()));
    }

    throw new LedjaError('Expected numeric value', LedjaErrorCode.UnknownError);
  }

  private static scValToBigInt(value: xdr.ScVal): bigint {
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

    throw new LedjaError('Expected integer value', LedjaErrorCode.UnknownError);
  }

  private static scValToStatus(value: xdr.ScVal): InvoiceStatus {
    const raw = this.scValToString(value);
    const normalized = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();

    if (normalized === 'Draft' || normalized === 'Issued' || normalized === 'Paid' || normalized === 'Overdue') {
      return normalized as InvoiceStatus;
    }

    throw new LedjaError('Invalid invoice status', LedjaErrorCode.UnknownError);
  }

  private static completeInvoice(invoice: Partial<Invoice>, fallbackId: number): Invoice {
    if (
      invoice.seller === undefined ||
      invoice.buyer === undefined ||
      invoice.amount === undefined ||
      invoice.dueDate === undefined ||
      invoice.status === undefined
    ) {
      throw new LedjaError('Incomplete invoice data', LedjaErrorCode.UnknownError);
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
