import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TrustWalletAdapter,
  BackpackWalletAdapter
} from '@solana/wallet-adapter-wallets';
import {
  Connection,
  PublicKey,
  Transaction,
  clusterApiUrl
} from '@solana/web3.js';
import { createContext, useContext } from 'react';

// Define available wallet types
export type WalletType = 
  | 'phantom' 
  | 'solflare' 
  | 'trustwallet' 
  | 'backpack'
  | 'coinbase';

// Solana cluster configuration
export const SOLANA_CLUSTER = 'mainnet-beta';

// Interface for wallet adapter
export interface WalletAdapter {
  walletName: string;
  publicKey: string | null | undefined;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transaction: Transaction[]) => Promise<Transaction[]>;
}

// Function to create a wallet adapter based on type
export const createWallet = (walletType?: WalletType): WalletAdapter => {
  let adapter;

  switch (walletType) {
    case 'phantom':
      adapter = new PhantomWalletAdapter();
      break;
    case 'solflare':
      adapter = new SolflareWalletAdapter();
      break;
    case 'trustwallet':
      adapter = new TrustWalletAdapter();
      break;
    case 'backpack':
      adapter = new BackpackWalletAdapter();
      break;
    case 'coinbase':
      adapter = new PhantomWalletAdapter();
      break;
    default:
      adapter = new PhantomWalletAdapter(); // Default to Phantom
      break;
  }

  return {
    walletName: adapter.name,
    publicKey: adapter.publicKey?.toBase58(),
    connected: adapter.connected,
    connect: async () => {
      try {
        await adapter.connect();
      } catch (error: any) {
        console.error(`Failed to connect to ${adapter.name}: ${error.message}`);
        throw error;
      }
    },
    disconnect: async () => {
      try {
        await adapter.disconnect();
      } catch (error: any) {
        console.error(`Failed to disconnect from ${adapter.name}: ${error.message}`);
        throw error;
      }
    },
    signTransaction: async (transaction: Transaction) => {
      try {
        return await adapter.signTransaction(transaction);
      } catch (error: any) {
        console.error(`Failed to sign transaction with ${adapter.name}: ${error.message}`);
        throw error;
      }
    },
    signAllTransactions: async (transactions: Transaction[]) => {
      try {
        return await adapter.signAllTransactions(transactions);
      } catch (error: any) {
        console.error(`Failed to sign all transactions with ${adapter.name}: ${error.message}`);
        throw error;
      }
    },
  };
};

// Function to check available wallets
export const getAvailableWallets = (): { type: WalletType; name: string }[] => {
  const wallets: { type: WalletType; name: string }[] = [];
  if (typeof window !== 'undefined') {
    if (window.phantom?.solana) {
      wallets.push({ type: 'phantom', name: 'Phantom' });
    }
    if (window.solflare) {
      wallets.push({ type: 'solflare', name: 'Solflare' });
    }
    if (window.trustwallet) {
      wallets.push({ type: 'trustwallet', name: 'Trust Wallet' });
    }
    if (window.backpack) {
      wallets.push({ type: 'backpack', name: 'Backpack' });
    }
  }
  return wallets;
};

// React context for wallet
export const WalletContext = createContext<{
  wallet: WalletAdapter | null;
  connecting: boolean;
  availableWallets: { type: WalletType; name: string }[];
  connectWallet: (type?: WalletType) => Promise<WalletAdapter | void>;
  disconnectWallet: () => Promise<void>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transaction: Transaction[]) => Promise<Transaction[]>;
}>({
  wallet: null,
  connecting: false,
  availableWallets: [],
  connectWallet: async () => {},
  disconnectWallet: async () => { },
  signTransaction: async () => { throw new Error('Not connected'); },
  signAllTransactions: async () => { throw new Error('Not connected'); },
});

// Hook to use wallet
export const useWallet = () => useContext(WalletContext);
