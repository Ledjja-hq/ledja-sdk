import { Keypair } from '@stellar/stellar-sdk';
import type { Invoice } from '../types';
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
    get(id: number): Promise<Invoice>;
    private static parseInvoiceValue;
    private static parseInvoiceMap;
    private static parseInvoiceVector;
    private static scValToAddress;
    private static scValToString;
    private static scValToNumber;
    private static scValToBigInt;
    private static scValToStatus;
    private static completeInvoice;
}
//# sourceMappingURL=invoices.d.ts.map