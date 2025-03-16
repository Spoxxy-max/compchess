
import { createContext, useContext } from 'react';
import { WalletAdapter, WalletType } from './walletTypes';

// React context for wallet
export const WalletContext = createContext<{
  wallet: WalletAdapter | null;
  connecting: boolean;
  availableWallets: { type: WalletType; name: string }[];
  connectWallet: (type?: WalletType) => Promise<WalletAdapter | void>;
  disconnectWallet: () => Promise<void>;
  smartContractExecute: (method: string, params: any) => Promise<any>;
}>({
  wallet: null,
  connecting: false,
  availableWallets: [],
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  smartContractExecute: async () => {},
});

// Hook to use wallet
export const useWallet = () => useContext(WalletContext);
