
import { BaseWalletAdapter } from './BaseWalletAdapter';
import { PublicKey, Transaction } from '@solana/web3.js';
import { Connection } from '@solana/web3.js';

export class BackpackWalletAdapter extends BaseWalletAdapter {
  walletName = 'Backpack';
  
  async connect(): Promise<void> {
    try {
      if (!window.backpack?.solana) {
        throw new Error('Backpack wallet not found');
      }
      
      // Request connection
      const result = await window.backpack.solana.connect();
      
      if (result && result.publicKey) {
        this.publicKey = result.publicKey.toString();
        this.connected = true;
        
        // Get wallet balance
        this.balance = await this.getBalance(this.publicKey);
        
        console.log(`Backpack wallet connected: ${this.publicKey}`);
      } else {
        throw new Error('Could not get publicKey from Backpack wallet');
      }
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
      
      if (!window.backpack.solana.signTransaction) {
        throw new Error('Backpack wallet does not support signTransaction');
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
      
      // Try to use signAndSendTransaction if available
      if (window.backpack.solana.signAndSendTransaction) {
        const result = await window.backpack.solana.signAndSendTransaction(transaction);
        return result.signature;
      }
      
      // Fallback: manually sign and send the transaction
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const signedTransaction = await this.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      return signature;
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
      
      if (!window.backpack.solana.signAllTransactions) {
        throw new Error('Backpack wallet does not support signAllTransactions');
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
      
      if (!window.backpack.solana.signMessage) {
        throw new Error('Backpack wallet does not support signMessage');
      }
      
      const signature = await window.backpack.solana.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Error signing message with Backpack wallet:', error);
      throw error;
    }
  }
}
