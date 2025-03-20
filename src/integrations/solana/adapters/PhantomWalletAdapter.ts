
import { BaseWalletAdapter } from './BaseWalletAdapter';
import { PublicKey, Transaction, Connection } from '@solana/web3.js';

export class PhantomWalletAdapter extends BaseWalletAdapter {
  walletName = 'Phantom';
  
  async connect(): Promise<void> {
    try {
      if (!window.phantom?.solana) {
        throw new Error('Phantom wallet not found');
      }
      
      // Request connection
      const result = await window.phantom.solana.connect();
      
      this.publicKey = result.publicKey.toString();
      this.connected = true;
      
      // Get wallet balance
      this.balance = await this.getBalance(this.publicKey);
      
      console.log(`Phantom wallet connected: ${this.publicKey}`);
    } catch (error) {
      console.error('Error connecting to Phantom wallet:', error);
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    try {
      if (window.phantom?.solana && this.connected) {
        await window.phantom.solana.disconnect();
        this.publicKey = null;
        this.connected = false;
        this.balance = 0;
        
        console.log('Phantom wallet disconnected');
      }
    } catch (error) {
      console.error('Error disconnecting from Phantom wallet:', error);
      throw error;
    }
  }
  
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      if (!window.phantom?.solana || !this.connected) {
        throw new Error('Phantom wallet not connected');
      }
      
      const signedTransaction = await window.phantom.solana.signTransaction(transaction);
      return signedTransaction;
    } catch (error) {
      console.error('Error signing transaction with Phantom wallet:', error);
      throw error;
    }
  }
  
  async sendTransaction(transaction: Transaction): Promise<string> {
    try {
      if (!window.phantom?.solana || !this.connected) {
        throw new Error('Phantom wallet not connected');
      }
      
      // If phantom has signAndSendTransaction, use it
      if (window.phantom.solana.signAndSendTransaction) {
        const result = await window.phantom.solana.signAndSendTransaction(transaction);
        return result.signature;
      }
      
      // Fallback: manually sign and send the transaction
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const signedTransaction = await this.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      return signature;
    } catch (error) {
      console.error('Error sending transaction with Phantom wallet:', error);
      throw error;
    }
  }
  
  async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    try {
      if (!window.phantom?.solana || !this.connected) {
        throw new Error('Phantom wallet not connected');
      }
      
      const signedTransactions = await window.phantom.solana.signAllTransactions(transactions);
      return signedTransactions;
    } catch (error) {
      console.error('Error signing all transactions with Phantom wallet:', error);
      throw error;
    }
  }
  
  async signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }> {
    try {
      if (!window.phantom?.solana || !this.connected) {
        throw new Error('Phantom wallet not connected');
      }
      
      const signature = await window.phantom.solana.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Error signing message with Phantom wallet:', error);
      throw error;
    }
  }
}
