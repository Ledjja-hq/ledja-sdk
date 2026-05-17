import { SorobanRpc } from '@stellar/stellar-sdk';

export interface LedjaConfig {
  network: 'testnet' | 'mainnet';
  rpcUrl?: string;
}

const DEFAULT_RPC: Record<LedjaConfig['network'], string> = {
  testnet: 'https://soroban-testnet.stellar.org',
  mainnet: 'https://soroban-rpc.mainnet.stellar.gateway.fm',
};

export class LedjaClient {
  readonly rpc: SorobanRpc.Server;
  readonly network: LedjaConfig['network'];

  constructor(config: LedjaConfig) {
    this.network = config.network;
    const rpcUrl = config.rpcUrl ?? DEFAULT_RPC[config.network];
    this.rpc = new SorobanRpc.Server(rpcUrl);
  }
}
