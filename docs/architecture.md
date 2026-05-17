# ledja-sdk Architecture

> Living document. Update this when module–contract interactions change.

## Overview

```
Developer App
     │
     ▼
LedjaClient (src/client.ts)
     │
     ├── client.invoices  ──► InvoicesModule  ──► ledja-contracts/invoice
     ├── client.payroll   ──► PayrollModule   ──► ledja-contracts/payroll
     ├── client.expenses  ──► ExpensesModule  ──► ledja-contracts/expense
     └── client.inventory ──► InventoryModule ──► ledja-contracts/inventory
```

## Network Layer

- Uses `@stellar/stellar-sdk` to build and submit Soroban transactions.
- Supports `testnet` and `mainnet` via `getNetworkConfig()` (see issue #18).
- Each module holds the contract ID for its corresponding deployed contract.

| Network  | Soroban RPC URL                                          | Passphrase constant      |
|----------|----------------------------------------------------------|--------------------------|
| testnet  | `https://soroban-testnet.stellar.org`                    | `Networks.TESTNET`       |
| mainnet  | `https://soroban-rpc.mainnet.stellar.gateway.fm`         | `Networks.PUBLIC`        |

## Wallet / Signing

- `LedjaClient` accepts a `Keypair` or a wallet interface at initialization.
- All transactions are signed before submission — no private keys are stored in the SDK.
- Future: support browser wallet adapters (e.g. Freighter) via an abstract `Signer` interface.

## Error Handling

- All Soroban contract errors are caught by `withErrorHandling()` (see issue #19).
- Errors are mapped to `LedjaError` instances with a typed `LedjaErrorCode`.
- Callers receive predictable, typed errors they can `switch` on.

```
LedjaError
  ├── code: LedjaErrorCode  (NotFound | Unauthorized | AlreadyExists | UnknownError | …)
  └── message: string
```

## Data Flow

```
client.invoices.create(params)
  → validate params
  → build Soroban transaction (ContractSpec + xdr)
  → sign with wallet keypair
  → submit to Soroban RPC
  → parse XDR response
  → return typed Invoice object  (or throw LedjaError)
```

## Module–Contract Mapping

| SDK Module       | Contract entrypoints used                              |
|------------------|--------------------------------------------------------|
| `InvoicesModule` | `create_invoice`, `pay_invoice`, `get_invoice`, `list_invoices` |
| `PayrollModule`  | `add_payroll_recipient`, `execute_payroll`, `list_recipients`   |
| `ExpensesModule` | `record_expense`, `list_expenses`                      |
| `InventoryModule`| TBD                                                    |

## Cross-Module Decisions

- All modules share the same `SorobanRpc.Server` instance from `LedjaClient`.
- Contract IDs are passed in at `LedjaClient` construction via `contractIds` config.
- No module imports another module — they are independent.

## References

- Issue #1 — LedjaClient scaffold
- Issue #2 — Folder structure
- Issue #4 — package.json / tsconfig
- Issue #5 — Core dependencies
- Issue #7 — LedjaError class
- Issue #18 — Network config helper
- Issue #19 — Error handling wrapper
