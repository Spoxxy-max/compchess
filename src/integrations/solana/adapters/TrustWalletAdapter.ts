import { BaseWalletAdapter } from './BaseWalletAdapter';

export class TrustWalletAdapter extends BaseWalletAdapter {
  walletName = 'Trust Wallet';

  async connect(): Promise<void> {
    try {
      const provider = window.trustwallet || window.solana;

      // Ensure Trust Wallet is available and supports Solana
      if (!provider || !provider.isTrust) {
        throw new Error('Trust Wallet is not installed or does not support Solana. Please install it.');
      }

      // Request connection
      const response = await provider.connect();

      // Ensure we get a Solana public key
      if (!provider.publicKey) {
        throw new Error("Failed to retrieve public key from Trust Wallet.");
      }

      this.publicKey = provider.publicKey.toString();
      this.connected = true;

      // Fetch balance
      await this.fetchBalance();

      console.log('Trust Wallet connected:', this.publicKey);
    } catch (error) {
      console.error('Error connecting Trust Wallet:', error);
      throw new Error("Failed to connect Trust Wallet. Make sure you are on Solana network.");
    }
  }

  async disconnect(): Promise<void> {
    try {
      const provider = window.trustwallet || window.solana;
      if (provider?.disconnect) {
        await provider.disconnect();
      }

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
