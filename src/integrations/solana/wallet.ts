
import { createContext, useContext, useState, useEffect } from 'react';

// Basic wallet interface
export interface WalletAdapter {
  publicKey: string | null;
  connected: boolean;
  balance: number;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

// Mock implementation for development
class PhantomWalletAdapter implements WalletAdapter {
  publicKey: string | null = null;
  connected: boolean = false;
  balance: number = 0;

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
      
      // Fetch balance (simulated for now)
      this.balance = Math.random() * 10; // Random balance between 0-10 SOL
      
      console.log('Wallet connected:', this.publicKey);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await window.phantom?.solana.disconnect();
      this.publicKey = null;
      this.connected = false;
      this.balance = 0;
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  }
}

// Create a default wallet instance
export const createWallet = (): WalletAdapter => {
  return new PhantomWalletAdapter();
};

// React context for wallet
export const WalletContext = createContext<{
  wallet: WalletAdapter | null;
  connecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
}>({
  wallet: null,
  connecting: false,
  connectWallet: async () => {},
  disconnectWallet: async () => {},
});

// Hook to use wallet
export const useWallet = () => useContext(WalletContext);
