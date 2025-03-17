
import { BaseWalletAdapter } from './BaseWalletAdapter';

export class SolflareWalletAdapter extends BaseWalletAdapter {
  walletName = 'Solflare';

  async connect(): Promise<void> {
    try {
      // Check if Solflare wallet is installed
      // const isSolflareInstalled = window.solflare;
      const isSolflareInstalled = typeof window !== 'undefined' && window.phantom?.solana;
      
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
