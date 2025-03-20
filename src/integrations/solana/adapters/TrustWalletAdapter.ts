
import { BaseWalletAdapter } from './BaseWalletAdapter';
import { PublicKey, Transaction } from '@solana/web3.js';

export class TrustWalletAdapter extends BaseWalletAdapter {
  walletName = 'Trust Wallet';
  
  async connect(): Promise<void> {
    try {
      const isTrustWallet = window.trustwallet || (window.solana && window.solana.isTrust);
      if (!isTrustWallet) {
        throw new Error('Trust Wallet not found');
      }
      
      // Use either the Trust Wallet adapter or the Solana adapter with Trust Wallet
      const provider = window.trustwallet || window.solana;
      
      // Request connection
      await provider.connect();
      
      this.publicKey = provider.publicKey.toString();
      this.connected = true;
      
      // Get wallet balance
      this.balance = await this.getBalance(this.publicKey);
      
      console.log(`Trust Wallet connected: ${this.publicKey}`);
    } catch (error) {
      console.error('Error connecting to Trust Wallet:', error);
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    try {
      const provider = window.trustwallet || (window.solana && window.solana.isTrust ? window.solana : null);
      
      if (provider && this.connected) {
        await provider.disconnect();
        this.publicKey = null;
        this.connected = false;
        this.balance = 0;
        
        console.log('Trust Wallet disconnected');
      }
    } catch (error) {
      console.error('Error disconnecting from Trust Wallet:', error);
      throw error;
    }
  }
  
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      const provider = window.trustwallet || (window.solana && window.solana.isTrust ? window.solana : null);
      
      if (!provider || !this.connected) {
        throw new Error('Trust Wallet not connected');
      }
      
      const signedTransaction = await provider.signTransaction(transaction);
      return signedTransaction;
    } catch (error) {
      console.error('Error signing transaction with Trust Wallet:', error);
      throw error;
    }
  }
  
  async sendTransaction(transaction: Transaction): Promise<string> {
    try {
      const provider = window.trustwallet || (window.solana && window.solana.isTrust ? window.solana : null);
      
      if (!provider || !this.connected) {
        throw new Error('Trust Wallet not connected');
      }
      
      // Sign and send the transaction
      const signature = await provider.signAndSendTransaction(transaction);
      return typeof signature === 'string' ? signature : signature.signature;
    } catch (error) {
      console.error('Error sending transaction with Trust Wallet:', error);
      throw error;
    }
  }
  
  async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    try {
      const provider = window.trustwallet || (window.solana && window.solana.isTrust ? window.solana : null);
      
      if (!provider || !this.connected) {
        throw new Error('Trust Wallet not connected');
      }
      
      const signedTransactions = await provider.signAllTransactions(transactions);
      return signedTransactions;
    } catch (error) {
      console.error('Error signing all transactions with Trust Wallet:', error);
      throw error;
    }
  }
  
  async signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }> {
    try {
      const provider = window.trustwallet || (window.solana && window.solana.isTrust ? window.solana : null);
      
      if (!provider || !this.connected) {
        throw new Error('Trust Wallet not connected');
      }
      
      const signature = await provider.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Error signing message with Trust Wallet:', error);
      throw error;
    }
  }
}
