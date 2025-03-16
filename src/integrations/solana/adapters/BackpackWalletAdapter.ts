
import { BaseWalletAdapter } from './BaseWalletAdapter';

export class BackpackWalletAdapter extends BaseWalletAdapter {
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
