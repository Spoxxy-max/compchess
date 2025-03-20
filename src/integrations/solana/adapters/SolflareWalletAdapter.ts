
import { BaseWalletAdapter } from './BaseWalletAdapter';
import { PublicKey, Transaction } from '@solana/web3.js';

export class SolflareWalletAdapter extends BaseWalletAdapter {
  walletName = 'Solflare';
  
  async connect(): Promise<void> {
    try {
      if (!window.solflare) {
        throw new Error('Solflare wallet not found');
      }
      
      // Request connection
      await window.solflare.connect();
      
      this.publicKey = window.solflare.publicKey.toString();
      this.connected = true;
      
      // Get wallet balance
      this.balance = await this.getBalance(this.publicKey);
      
      console.log(`Solflare wallet connected: ${this.publicKey}`);
    } catch (error) {
      console.error('Error connecting to Solflare wallet:', error);
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    try {
      if (window.solflare && this.connected) {
        await window.solflare.disconnect();
        this.publicKey = null;
        this.connected = false;
        this.balance = 0;
        
        console.log('Solflare wallet disconnected');
      }
    } catch (error) {
      console.error('Error disconnecting from Solflare wallet:', error);
      throw error;
    }
  }
  
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      if (!window.solflare || !this.connected) {
        throw new Error('Solflare wallet not connected');
      }
      
      const signedTransaction = await window.solflare.signTransaction(transaction);
      return signedTransaction;
    } catch (error) {
      console.error('Error signing transaction with Solflare wallet:', error);
      throw error;
    }
  }
  
  async sendTransaction(transaction: Transaction): Promise<string> {
    try {
      if (!window.solflare || !this.connected) {
        throw new Error('Solflare wallet not connected');
      }
      
      // Sign and send the transaction
      const signature = await window.solflare.signAndSendTransaction(transaction);
      return signature;
    } catch (error) {
      console.error('Error sending transaction with Solflare wallet:', error);
      throw error;
    }
  }
  
  async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    try {
      if (!window.solflare || !this.connected) {
        throw new Error('Solflare wallet not connected');
      }
      
      const signedTransactions = await window.solflare.signAllTransactions(transactions);
      return signedTransactions;
    } catch (error) {
      console.error('Error signing all transactions with Solflare wallet:', error);
      throw error;
    }
  }
  
  async signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }> {
    try {
      if (!window.solflare || !this.connected) {
        throw new Error('Solflare wallet not connected');
      }
      
      const signature = await window.solflare.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Error signing message with Solflare wallet:', error);
      throw error;
    }
  }
}
