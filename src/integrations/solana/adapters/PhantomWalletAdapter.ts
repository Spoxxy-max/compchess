
import { BaseWalletAdapter } from './BaseWalletAdapter';

export class PhantomWalletAdapter extends BaseWalletAdapter {
  walletName = 'Phantom';

  async connect(): Promise<void> {
    try {
      // Check if Phantom wallet is installed
      // 
      // const isPhantomInstalled = window.phantom?.solana;
      //  Modified to the below
      const isPhantomInstalled = typeof window !== 'undefined' && window.phantom?.solana;
      
      if (!isPhantomInstalled) {
        // Mock in development for testing
        if (process.env.NODE_ENV === 'development') {
          this.publicKey = "Phantom_" + Math.random().toString(36).substring(2, 10);
          this.connected = true;
          this.balance = Math.random() * 10;
          console.log('Phantom wallet connected (mock):', this.publicKey);
          return;
        }
        throw new Error('Phantom wallet is not installed');
      }

      // Connect to the wallet
      const response = await window.phantom.solana.connect();
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
      if (window.phantom?.solana) {
        await window.phantom.solana.disconnect();
      }
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
