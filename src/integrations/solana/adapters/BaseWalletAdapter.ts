
import { WalletAdapter } from '../walletTypes';

// Base wallet class
export abstract class BaseWalletAdapter implements WalletAdapter {
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
