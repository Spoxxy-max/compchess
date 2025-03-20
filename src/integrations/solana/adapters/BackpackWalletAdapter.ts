
import { BaseWalletAdapter } from './BaseWalletAdapter';
import { PublicKey, Transaction } from '@solana/web3.js';

export class BackpackWalletAdapter extends BaseWalletAdapter {
  walletName = 'Backpack';
  
  async connect(): Promise<void> {
    try {
      if (!window.backpack?.solana) {
        throw new Error('Backpack wallet not found');
      }
      
      // Request connection
      const result = await window.backpack.solana.connect();
      
      this.publicKey = result.publicKey.toString();
      this.connected = true;
      
      // Get wallet balance
      this.balance = await this.getBalance(this.publicKey);
      
      console.log(`Backpack wallet connected: ${this.publicKey}`);
    } catch (error) {
      console.error('Error connecting to Backpack wallet:', error);
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    try {
      if (window.backpack?.solana && this.connected) {
        await window.backpack.solana.disconnect();
        this.publicKey = null;
        this.connected = false;
        this.balance = 0;
        
        console.log('Backpack wallet disconnected');
      }
    } catch (error) {
      console.error('Error disconnecting from Backpack wallet:', error);
      throw error;
    }
  }
  
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      if (!window.backpack?.solana || !this.connected) {
        throw new Error('Backpack wallet not connected');
      }
      
      const signedTransaction = await window.backpack.solana.signTransaction(transaction);
      return signedTransaction;
    } catch (error) {
      console.error('Error signing transaction with Backpack wallet:', error);
      throw error;
    }
  }
  
  async sendTransaction(transaction: Transaction): Promise<string> {
    try {
      if (!window.backpack?.solana || !this.connected) {
        throw new Error('Backpack wallet not connected');
      }
      
      // Sign and send the transaction
      const signature = await window.backpack.solana.signAndSendTransaction(transaction);
      return signature.signature;
    } catch (error) {
      console.error('Error sending transaction with Backpack wallet:', error);
      throw error;
    }
  }
  
  async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    try {
      if (!window.backpack?.solana || !this.connected) {
        throw new Error('Backpack wallet not connected');
      }
      
      const signedTransactions = await window.backpack.solana.signAllTransactions(transactions);
      return signedTransactions;
    } catch (error) {
      console.error('Error signing all transactions with Backpack wallet:', error);
      throw error;
    }
  }
  
  async signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }> {
    try {
      if (!window.backpack?.solana || !this.connected) {
        throw new Error('Backpack wallet not connected');
      }
      
      const signature = await window.backpack.solana.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Error signing message with Backpack wallet:', error);
      throw error;
    }
  }
}
