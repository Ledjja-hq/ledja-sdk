export type InvoiceStatus = 'Draft' | 'Issued' | 'Paid' | 'Overdue';
export interface Invoice {
    id: number;
    seller: string;
    buyer: string;
    amount: bigint;
    dueDate: number;
    status: InvoiceStatus;
}
export interface PayrollRecord {
    recipient: string;
    amount: bigint;
    frequencyDays: number;
    lastPaid: number;
}
export interface Expense {
    id: number;
    submitter: string;
    amount: bigint;
    category: string;
    timestamp: number;
    linkedInvoiceId?: number;
}
export interface InventoryItem {
    sku: string;
    quantity: bigint;
    linkedInvoiceId?: number;
}
//# sourceMappingURL=index.d.ts.map