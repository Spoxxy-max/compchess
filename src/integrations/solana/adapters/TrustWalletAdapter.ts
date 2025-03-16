
import { BaseWalletAdapter } from './BaseWalletAdapter';

export class TrustWalletAdapter extends BaseWalletAdapter {
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
