
import { WalletType } from './walletTypes';
import { PhantomWalletAdapter } from './adapters/PhantomWalletAdapter';
import { SolflareWalletAdapter } from './adapters/SolflareWalletAdapter';
import { TrustWalletAdapter } from './adapters/TrustWalletAdapter';
import { BackpackWalletAdapter } from './adapters/BackpackWalletAdapter';

// Factory function to create wallet by type
export const createWallet = (type?: WalletType) => {
  switch (type) {
    case 'phantom':
      return new PhantomWalletAdapter();
    case 'solflare':
      return new SolflareWalletAdapter();
    case 'trustwallet':
      return new TrustWalletAdapter();
    case 'backpack':
      return new BackpackWalletAdapter();
    default:
      // Default to Phantom if no type specified
      return new PhantomWalletAdapter();
  }
};

// Get all available wallets
export const getAvailableWallets = (): { type: WalletType; name: string }[] => {
  const wallets = [];
  
  // For development purposes, always provide all wallet options
  if (process.env.NODE_ENV === 'development') {
    wallets.push({ type: 'phantom', name: 'Phantom' });
    wallets.push({ type: 'solflare', name: 'Solflare' });
    wallets.push({ type: 'trustwallet', name: 'Trust Wallet' });
    wallets.push({ type: 'backpack', name: 'Backpack' });
    return wallets;
  }
  
  // For production, check for actual wallet extensions
  if (window.phantom?.solana) {
    wallets.push({ type: 'phantom', name: 'Phantom' });
  }
  
  if (window.solflare) {
    wallets.push({ type: 'solflare', name: 'Solflare' });
  }
  
  if (window.trustwallet || window.solana?.isTrust) {
    wallets.push({ type: 'trustwallet', name: 'Trust Wallet' });
  }
  
  if (window.backpack?.solana) {
    wallets.push({ type: 'backpack', name: 'Backpack' });
  }
  
  return wallets;
};
