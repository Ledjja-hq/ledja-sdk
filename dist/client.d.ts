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
export declare class LedjaClient {
    readonly network: Network;
    readonly invoices: InvoicesModule;
    readonly payroll: PayrollModule;
    readonly expenses: ExpensesModule;
    constructor(config: LedjaClientConfig);
}
//# sourceMappingURL=client.d.ts.map