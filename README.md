# ledja-sdk
TypeScript SDK for Ledja — lets developers integrate Ledja's Stellar-powered invoicing, payroll and expense features into their own applications.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Built on Stellar](https://img.shields.io/badge/Built%20on-Stellar-blueviolet)](https://stellar.org)

## Overview

ledja-sdk is the official TypeScript SDK for the Ledja platform. It provides a clean API for integrating Stellar-powered invoicing, payroll, and expense management into any application, abstracting the complexity of Soroban smart contract interactions.

## Installation

npm install ledja-sdk

## Quick Start

Import LedjaClient from ledja-sdk, initialize with your network and wallet, then call client.invoices.create(), client.payroll.execute(), or client.expenses.record() to interact with on-chain contracts.

## API Reference

LedjaClient is the main entry point. It exposes client.invoices (create, pay, get, list), client.payroll (create, execute, list), and client.expenses (record, list).

## Ecosystem Fit and Monetization

ledja-sdk is the developer distribution layer of Ledja. It drives adoption across the Stellar ecosystem by enabling fintech startups, SME platforms, and accounting tools to embed Ledja financial primitives. Monetization comes via enterprise licensing for advanced features and protocol fees on on-chain contract calls.

## Contributing

New to open source? The SDK is a great starting point. Good first issues include adding method wrappers, improving TypeScript typings, and writing usage examples. Check the issues tab for tasks labeled good first issue.

## Related Repositories

- ledja-frontend: Reference web app built with this SDK
- - ledja-contracts: Soroban contracts this SDK calls
  - - ledja-indexer: Data layer this SDK queries
   
    - ## License
   
    - MIT (c) Ledjja-hq
