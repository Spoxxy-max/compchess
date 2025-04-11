
import { createContext, useContext } from 'react';
import { WalletAdapter, WalletType } from './walletTypes';

// React context for wallet
export interface WalletContextType {
  wallet: WalletAdapter | null;
  connecting: boolean;
  availableWallets: { type: WalletType; name: string }[];
  connectWallet: (type?: WalletType) => Promise<WalletAdapter | void>;
  disconnectWallet: () => Promise<void>;
  smartContractExecute: (method: string, params: any) => Promise<any>;
  isMobileDevice: boolean;
  mobileWalletDetected: boolean;
  detectedMobileWallets: { type: WalletType; name: string }[];
}

const defaultContext: WalletContextType = {
  wallet: null,
  connecting: false,
  availableWallets: [],
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  smartContractExecute: async () => ({ success: false, error: "Context not initialized" }),
  isMobileDevice: false,
  mobileWalletDetected: false,
  detectedMobileWallets: []
};

export const WalletContext = createContext<WalletContextType>(defaultContext);

// Hook to use wallet
export const useWallet = () => useContext(WalletContext);
