
import { PublicKey, Transaction } from '@solana/web3.js';

declare global {
  interface Window {
    phantom?: {
      solana: {
        connect: () => Promise<{ publicKey: PublicKey }>;
        disconnect: () => Promise<void>;
        publicKey?: PublicKey;
        signTransaction: (transaction: Transaction) => Promise<Transaction>;
        signAndSendTransaction?: (transaction: Transaction) => Promise<{ signature: string }>;
        signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
        signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
      };
    };
    solflare?: {
      connect: () => Promise<void>;
      disconnect: () => Promise<void>;
      publicKey?: PublicKey;
      signTransaction: (transaction: Transaction) => Promise<Transaction>;
      signAndSendTransaction?: (transaction: Transaction) => Promise<string>;
      signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
      signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
    };
    trustwallet?: {
      isTrust: boolean;
      request(arg0: { method: string; }): unknown;
      connect: () => Promise<void>;
      disconnect: () => Promise<void>;
      publicKey?: PublicKey;
      signTransaction?: (transaction: Transaction) => Promise<Transaction>;
      signAndSendTransaction?: (transaction: Transaction) => Promise<string | { signature: string }>;
      signAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>;
      signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
    };
    backpack?: {
      solana: {
        connect: () => Promise<{ publicKey: PublicKey }>;
        disconnect: () => Promise<void>;
        publicKey?: PublicKey;
        signTransaction?: (transaction: Transaction) => Promise<Transaction>;
        signAndSendTransaction?: (transaction: Transaction) => Promise<{ signature: string }>;
        signAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>;
        signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
      };
    };
    solana?: {
      connect: () => Promise<void>;
      disconnect: () => Promise<void>;
      publicKey?: PublicKey;
      signTransaction?: (transaction: Transaction) => Promise<Transaction>;
      signAndSendTransaction?: (transaction: Transaction) => Promise<string | { signature: string }>;
      signAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>;
      signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
      isTrust?: boolean;
    };
  }
}
