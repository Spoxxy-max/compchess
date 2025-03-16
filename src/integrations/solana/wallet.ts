import { createContext, useContext } from 'react';
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

// Base wallet class
abstract class BaseWalletAdapter implements WalletAdapter {
  publicKey: string | null = null;
  connected: boolean = false;
  balance: number = 0;
  abstract walletName: string | null;

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  
  async fetchBalance(): Promise<number> {
    if (!this.publicKey) return 0;
    
    try {
      // Use Solana JSON RPC API to fetch the real balance
      const response = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [this.publicKey],
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.error('Error fetching balance:', data.error);
        throw new Error(data.error.message);
      }
      
      // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
      if (data.result?.value !== undefined) {
        this.balance = data.result.value / 1000000000;
        return this.balance;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      
      // In development environment, return random balance as fallback
      if (process.env.NODE_ENV === 'development') {
        this.balance = Math.random() * 10;
        return this.balance;
      }
      
      throw error;
    }
  }
}

// Phantom wallet implementation
class PhantomWalletAdapter extends BaseWalletAdapter {
  walletName = 'Phantom';

  async connect(): Promise<void> {
    try {
      // Check if Phantom wallet is installed
      const isPhantomInstalled = window.phantom?.solana;
      
      if (!isPhantomInstalled) {
        throw new Error('Phantom wallet is not installed');
      }

      // Connect to the wallet
      const response = await window.phantom?.solana.connect();
      this.publicKey = response.publicKey.toString();
      this.connected = true;
      
      // Fetch real balance
      await this.fetchBalance();
      
      console.log('Phantom wallet connected:', this.publicKey);
    } catch (error) {
      console.error('Error connecting Phantom wallet:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await window.phantom?.solana.disconnect();
      this.publicKey = null;
      this.connected = false;
      this.balance = 0;
      console.log('Phantom wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting Phantom wallet:', error);
      throw error;
    }
  }
}

// Solflare wallet adapter
class SolflareWalletAdapter extends BaseWalletAdapter {
  walletName = 'Solflare';

  async connect(): Promise<void> {
    try {
      // Check if Solflare wallet is installed
      const isSolflareInstalled = window.solflare;
      
      if (!isSolflareInstalled) {
        throw new Error('Solflare wallet is not installed');
      }

      // Connect to the wallet
      await window.solflare.connect();
      this.publicKey = window.solflare.publicKey?.toString() || null;
      this.connected = true;
      
      // Fetch real balance
      await this.fetchBalance();
      
      console.log('Solflare wallet connected:', this.publicKey);
    } catch (error) {
      console.error('Error connecting Solflare wallet:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await window.solflare?.disconnect();
      this.publicKey = null;
      this.connected = false;
      this.balance = 0;
      console.log('Solflare wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting Solflare wallet:', error);
      throw error;
    }
  }
}

// Trust Wallet adapter
class TrustWalletAdapter extends BaseWalletAdapter {
  walletName = 'Trust Wallet';

  async connect(): Promise<void> {
    try {
      // Check if Trust wallet adapter is available
      const isTrustWalletInstalled = window.trustwallet || window.solana?.isTrust;
      
      if (!isTrustWalletInstalled) {
        // Mock in development
        if (process.env.NODE_ENV === 'development') {
          this.publicKey = "Trust_" + Math.random().toString(36).substring(2, 10);
          this.connected = true;
          await this.fetchBalance();
          console.log('Trust Wallet connected (mock):', this.publicKey);
          return;
        }
        throw new Error('Trust Wallet is not installed');
      }

      // Connect to the wallet (using actual Trust wallet if available)
      const provider = window.trustwallet || window.solana;
      await provider?.connect();
      this.publicKey = provider?.publicKey?.toString() || null;
      this.connected = true;
      
      // Fetch balance
      await this.fetchBalance();
      
      console.log('Trust Wallet connected:', this.publicKey);
    } catch (error) {
      console.error('Error connecting Trust Wallet:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      const provider = window.trustwallet || window.solana;
      await provider?.disconnect?.();
      this.publicKey = null;
      this.connected = false;
      this.balance = 0;
      console.log('Trust Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting Trust Wallet:', error);
      throw error;
    }
  }
}

// Backpack wallet adapter
class BackpackWalletAdapter extends BaseWalletAdapter {
  walletName = 'Backpack';

  async connect(): Promise<void> {
    try {
      // Check if Backpack wallet is installed
      const isBackpackInstalled = window.backpack?.solana;
      
      if (!isBackpackInstalled) {
        // Mock in development
        if (process.env.NODE_ENV === 'development') {
          this.publicKey = "Backpack_" + Math.random().toString(36).substring(2, 10);
          this.connected = true;
          await this.fetchBalance();
          console.log('Backpack wallet connected (mock):', this.publicKey);
          return;
        }
        throw new Error('Backpack wallet is not installed');
      }

      // Connect to the wallet
      await window.backpack?.solana.connect();
      this.publicKey = window.backpack?.solana.publicKey?.toString() || null;
      this.connected = true;
      
      // Fetch balance
      await this.fetchBalance();
      
      console.log('Backpack wallet connected:', this.publicKey);
    } catch (error) {
      console.error('Error connecting Backpack wallet:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await window.backpack?.solana.disconnect?.();
      this.publicKey = null;
      this.connected = false;
      this.balance = 0;
      console.log('Backpack wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting Backpack wallet:', error);
      throw error;
    }
  }
}

// Factory function to create wallet by type
export const createWallet = (type?: WalletType): WalletAdapter => {
  switch (type) {
    case 'phantom':
      return new PhantomWalletAdapter();
    case 'solflare':
      return new SolflareWalletAdapter();
    case 'trustwallet':
      return new TrustWalletAdapter();
    case 'backpack':
      return new BackpackWalletAdapter();
    default:
      // Default to Phantom if no type specified
      return new PhantomWalletAdapter();
  }
};

// Get all available wallets
export const getAvailableWallets = (): { type: WalletType; name: string }[] => {
  const wallets = [];
  
  if (window.phantom?.solana) {
    wallets.push({ type: 'phantom', name: 'Phantom' });
  }
  
  if (window.solflare) {
    wallets.push({ type: 'solflare', name: 'Solflare' });
  }
  
  if (window.trustwallet || window.solana?.isTrust) {
    wallets.push({ type: 'trustwallet', name: 'Trust Wallet' });
  }
  
  if (window.backpack?.solana) {
    wallets.push({ type: 'backpack', name: 'Backpack' });
  }
  
  // For development purposes, we'll always add these options in dev mode
  if (process.env.NODE_ENV === 'development' && wallets.length === 0) {
    wallets.push({ type: 'phantom', name: 'Phantom' });
    wallets.push({ type: 'solflare', name: 'Solflare' });
    wallets.push({ type: 'trustwallet', name: 'Trust Wallet' });
    wallets.push({ type: 'backpack', name: 'Backpack' });
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
  smartContractExecute: (method: string, params: any) => Promise<any>;
}>({
  wallet: null,
  connecting: false,
  availableWallets: [],
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  smartContractExecute: async () => {},
});

// Hook to use wallet
export const useWallet = () => useContext(WalletContext);
