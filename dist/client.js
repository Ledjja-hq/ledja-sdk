"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedjaClient = void 0;
const invoices_1 = require("./modules/invoices");
const payroll_1 = require("./modules/payroll");
const expenses_1 = require("./modules/expenses");
function getNetworkConfig(network) {
    if (network === 'mainnet') {
        return { rpcUrl: 'https://mainnet.stellar.validationcloud.io/v1/soroban/rpc' };
    }
    return { rpcUrl: 'https://soroban-testnet.stellar.org' };
}
class LedjaClient {
    constructor(config) {
        this.network = config.network;
        const { rpcUrl } = getNetworkConfig(config.network);
        this.invoices = new invoices_1.InvoicesModule(rpcUrl, config.contractIds.invoice);
        this.payroll = new payroll_1.PayrollModule(rpcUrl, config.contractIds.payroll);
        this.expenses = new expenses_1.ExpensesModule(rpcUrl, config.contractIds.expense);
    }
}
exports.LedjaClient = LedjaClient;
//# sourceMappingURL=client.js.map