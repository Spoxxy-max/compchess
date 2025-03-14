
import React, { useState, useEffect } from 'react';
import { 
  WalletContext, 
  createWallet, 
  WalletAdapter, 
  getAvailableWallets,
  WalletType 
} from '../integrations/solana/wallet';
import { executeSmartContractMethod } from '../integrations/solana/smartContract';
import { useToast } from "@/hooks/use-toast";

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletAdapter | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<{ type: WalletType; name: string }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Get available wallets
    const wallets = getAvailableWallets();
    setAvailableWallets(wallets);
    
    // Try to auto-connect to the last wallet used
    const lastWalletType = localStorage.getItem('lastWalletType') as WalletType | undefined;
    if (lastWalletType) {
      connectWallet(lastWalletType).catch(err => {
        console.log('Failed to auto-connect wallet:', err);
      });
    }
  }, []);

  const connectWallet = async (type?: WalletType) => {
    if (connecting) return;
    
    try {
      setConnecting(true);
      
      // Create wallet instance based on type
      const newWallet = createWallet(type);
      
      // Connect wallet
      await newWallet.connect();
      
      // Save wallet instance and type
      setWallet(newWallet);
      if (type) localStorage.setItem('lastWalletType', type);
      
      toast({
        title: `${newWallet.walletName} Connected`,
        description: "Successfully connected to your Solana wallet",
      });
      
      return newWallet;
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to wallet",
        variant: "destructive",
      });
      throw error;
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    if (!wallet) return;
    
    try {
      await wallet.disconnect();
      setWallet(null);
      localStorage.removeItem('lastWalletType');
      
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from your Solana wallet",
      });
    } catch (error: any) {
      toast({
        title: "Disconnect Failed",
        description: error.message || "Failed to disconnect wallet",
        variant: "destructive",
      });
    }
  };

  // Smart contract execution function
  const smartContractExecute = async (method: string, params: any) => {
    if (!wallet?.connected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to interact with the smart contract",
        variant: "destructive",
      });
      return { success: false, error: "Wallet not connected" };
    }
    
    try {
      const result = await executeSmartContractMethod(method as any, params);
      
      if (result.success) {
        toast({
          title: "Transaction Successful",
          description: `Successfully executed ${method}`,
        });
      } else {
        toast({
          title: "Transaction Failed",
          description: result.error?.message || `Failed to execute ${method}`,
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error: any) {
      toast({
        title: "Transaction Error",
        description: error.message || `Error executing ${method}`,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return (
    <WalletContext.Provider 
      value={{ 
        wallet, 
        connecting, 
        availableWallets,
        connectWallet, 
        disconnectWallet,
        smartContractExecute
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
