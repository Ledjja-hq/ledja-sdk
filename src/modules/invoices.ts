import {
  Keypair,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  Address,
  Contract,
} from '@stellar/stellar-sdk';
import { rpc as SorobanRpc } from '@stellar/stellar-sdk';
import { LedjaError, LedjaErrorCode } from '../errors';

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
}
