
import { PublicKey } from '@solana/web3.js';

// Wallet adapter interface
export interface WalletAdapter {
  publicKey: string | null;
  connected: boolean;
  balance: number;
  walletName: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction?: (transaction: any) => Promise<any>;
  signAllTransactions?: (transactions: any[]) => Promise<any[]>;
  signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
}

// Available wallet types
export type WalletType = 'phantom' | 'solflare' | 'trustwallet' | 'backpack' | 'coinbase';

// We're not declaring global Window extensions here anymore as they're in global.d.ts
