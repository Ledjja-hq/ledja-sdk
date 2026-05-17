import { Keypair } from '@stellar/stellar-sdk';

export type Network = 'testnet' | 'mainnet';

export interface LedjaClientConfig {
  network: Network;
  keypair: Keypair;
}

export class LedjaClient {
  public readonly network: Network;
  private readonly keypair: Keypair;

  constructor(config: LedjaClientConfig) {
    this.network = config.network;
    this.keypair = config.keypair;
  }
}
