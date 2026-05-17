import { Keypair } from '@stellar/stellar-sdk';
import { InvoicesModule } from './modules/invoices';
import { PayrollModule } from './modules/payroll';
import { ExpensesModule } from './modules/expenses';

export type Network = 'testnet' | 'mainnet';

export interface ContractIds {
  invoice: string;
  payroll: string;
  expense: string;
}

export interface LedjaClientConfig {
  network: Network;
  keypair: Keypair;
  contractIds: ContractIds;
}

function getNetworkConfig(network: Network): { rpcUrl: string } {
  if (network === 'mainnet') {
    return { rpcUrl: 'https://mainnet.stellar.validationcloud.io/v1/soroban/rpc' };
  }
  return { rpcUrl: 'https://soroban-testnet.stellar.org' };
}

export class LedjaClient {
  public readonly network: Network;
  public readonly invoices: InvoicesModule;
  public readonly payroll: PayrollModule;
  public readonly expenses: ExpensesModule;

  constructor(config: LedjaClientConfig) {
    this.network = config.network;
    const { rpcUrl } = getNetworkConfig(config.network);
    this.invoices = new InvoicesModule(rpcUrl, config.contractIds.invoice);
    this.payroll = new PayrollModule(rpcUrl, config.contractIds.payroll);
    this.expenses = new ExpensesModule(rpcUrl, config.contractIds.expense);
  }
}
