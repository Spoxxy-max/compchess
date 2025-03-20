
import { PublicKey, Connection, Transaction } from '@solana/web3.js';
import { WalletAdapter } from '../walletTypes';

export class BaseWalletAdapter implements WalletAdapter {
  publicKey: string | null = null;
  connected: boolean = false;
  balance: number = 0;
  walletName: string | null = null;
  
  async connect(): Promise<void> {
    throw new Error('Method not implemented in base class');
  }
  
  async disconnect(): Promise<void> {
    throw new Error('Method not implemented in base class');
  }
  
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    throw new Error('Method not implemented in base class');
  }
  
  async sendTransaction(transaction: Transaction): Promise<string> {
    throw new Error('Method not implemented in base class');
  }
  
  async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    throw new Error('Method not implemented in base class');
  }
  
  async signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }> {
    throw new Error('Method not implemented in base class');
  }
  
  protected async getBalance(publicKey: string): Promise<number> {
    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const balance = await connection.getBalance(new PublicKey(publicKey));
      return balance / 1_000_000_000; // Convert lamports to SOL
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }
}
