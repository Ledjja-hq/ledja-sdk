import { Keypair } from '@stellar/stellar-sdk';
export interface CreateInvoiceParams {
    buyer: string;
    amount: bigint;
    dueDate: number;
    keypair: Keypair;
}
export declare class InvoicesModule {
    private readonly rpcUrl;
    private readonly contractId;
    constructor(rpcUrl: string, contractId: string);
    create(params: CreateInvoiceParams): Promise<number>;
}
//# sourceMappingURL=invoices.d.ts.map