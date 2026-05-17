export class ExpensesModule {
  private readonly rpcUrl: string;
  private readonly contractId: string;

  constructor(rpcUrl: string, contractId: string) {
    this.rpcUrl = rpcUrl;
    this.contractId = contractId;
  }
}