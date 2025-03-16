
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
export type WalletType = 'phantom' | 'solflare' | 'trustwallet' | 'backpack' | 'glow' | 'coinbase';

// Declare global window extensions for wallet detection
declare global {
  interface Window {
    phantom?: {
      solana?: {
        connect: () => Promise<{ publicKey: { toString: () => string } }>;
        disconnect: () => Promise<void>;
        publicKey?: { toString: () => string };
        signTransaction?: (transaction: any) => Promise<any>;
        signAllTransactions?: (transactions: any[]) => Promise<any[]>;
        signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
      };
    };
    solflare?: {
      connect: () => Promise<void>;
      disconnect: () => Promise<void>;
      publicKey?: { toString: () => string };
      signTransaction?: (transaction: any) => Promise<any>;
      signAllTransactions?: (transactions: any[]) => Promise<any[]>;
      signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
    };
    trustwallet?: {
      connect: () => Promise<void>;
      disconnect: () => Promise<void>;
      publicKey?: { toString: () => string };
    };
    backpack?: {
      solana?: {
        connect: () => Promise<void>;
        disconnect: () => Promise<void>;
        publicKey?: { toString: () => string };
      };
    };
    solana?: {
      connect: () => Promise<void>;
      disconnect: () => Promise<void>;
      publicKey?: { toString: () => string };
      signTransaction?: (transaction: any) => Promise<any>;
      signAllTransactions?: (transactions: any[]) => Promise<any[]>;
      isTrust?: boolean;
    };
  }
}
