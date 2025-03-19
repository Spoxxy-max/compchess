
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  WalletContext, 
  WalletAdapter, 
  WalletType,
  createWallet,
  getAvailableWallets
} from '../integrations/solana/wallet';
import { executeSmartContractMethod } from '../integrations/solana/smartContract';
import { useToast } from "@/hooks/use-toast";

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletAdapter | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<{ type: WalletType; name: string }[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const wallets = getAvailableWallets();
    setAvailableWallets(wallets);

    // Disconnect wallet on page refresh
    const disconnectOnReload = async () => {
      await disconnectWallet();
      console.log("Wallet disconnected on page refresh");
    };

    window.addEventListener("beforeunload", disconnectOnReload);

    return () => {
      window.removeEventListener("beforeunload", disconnectOnReload);
    };
  }, []);

  const connectWallet = async (type?: WalletType): Promise<WalletAdapter | void> => {
    if (connecting) return;
    
    try {
      setConnecting(true);
      
      const newWallet = createWallet(type);

      // Check if the wallet is installed
      if (type === 'phantom' && !window.phantom?.solana) {
        throw new Error('Phantom wallet is not installed. Please install it from https://phantom.app/');
      } 
      if (type === 'solflare' && !window.solflare) {
        throw new Error('Solflare wallet is not installed. Please install it from https://solflare.com/');
      } 
      if (type === 'trustwallet' && !(window.trustwallet || window.solana?.isTrust)) {
        throw new Error('Trust Wallet is not installed. Please install it from https://trustwallet.com/');
      } 
      if (type === 'backpack' && !window.backpack?.solana) {
        throw new Error('Backpack wallet is not installed. Please install it from https://www.backpack.app/');
      }

      try {
        await newWallet.connect();
        
        console.log(`${newWallet.walletName} wallet connected:`, newWallet.publicKey);
        
        setWallet(newWallet);
        if (type) localStorage.setItem('lastWalletType', type);
        
        toast({
          title: `${newWallet.walletName} Connected`,
          description: "Successfully connected to your Solana wallet",
        });
        
        return newWallet;
      } catch (connectError: any) {
        // If connection fails due to a fetch error, try to proceed with a fake PK
        if (connectError.message === 'Failed to fetch') {
          console.warn("Balance fetch failed, but continuing with wallet connection");
          
          // Force the connection without network dependency
          newWallet.connected = true;
          if (!newWallet.publicKey) {
            // Generate a fake public key for dev purposes
            newWallet.publicKey = `dev_${Math.random().toString(36).substring(2, 10)}`;
          }
          
          setWallet(newWallet);
          if (type) localStorage.setItem('lastWalletType', type);
          
          toast({
            title: `${newWallet.walletName} Connected (Dev Mode)`,
            description: "Connected to your wallet in development mode",
          });
          
          return newWallet;
        } else {
          throw connectError;
        }
      }
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
      
      if (location.pathname !== '/') {
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Disconnect Failed",
        description: error.message || "Failed to disconnect wallet",
        variant: "destructive",
      });
    }
  };

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
