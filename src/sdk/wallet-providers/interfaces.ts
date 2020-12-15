import { BytesLike } from 'ethers';
import { TypedData } from 'ethers-typed-data';
import { UniqueSubject } from '../common';
import { NetworkNames } from '../network';

export interface WalletProvider {
  readonly type?: string;
  readonly address: string;
  readonly address$?: UniqueSubject<string>;
  readonly networkName?: NetworkNames;
  readonly networkName$?: UniqueSubject<NetworkNames>;

  personalSignMessage(message: BytesLike): Promise<string>;

  signMessage(message: BytesLike): Promise<string>;

  signTypedData(typedData: TypedData): Promise<string>;
}

export interface Web3Provider {
  send(payload: any, callback: (err: any, response?: any) => any): any;
}

export interface WalletConnectConnector {
  accounts: string[];
  chainId: number;
  signMessage(params: any[]): Promise<any>;
  signPersonalMessage(params: any[]): Promise<any>;
  signTypedData(params: any[]): Promise<any>;
  on(event: string, callback: (error: Error | null, payload: any | null) => void): void;
}

export interface WalletLike {
  privateKey: string;
}

export type WalletProviderLike = string | WalletLike | WalletProvider;
