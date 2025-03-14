
import React, { useState, useEffect } from 'react';
import { WalletContext, createWallet, WalletAdapter } from '../integrations/solana/wallet';
import { useToast } from "@/hooks/use-toast";

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletAdapter | null>(null);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize wallet
    const newWallet = createWallet();
    setWallet(newWallet);
  }, []);

  const connectWallet = async () => {
    if (!wallet) return;
    
    try {
      setConnecting(true);
      await wallet.connect();
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to your Solana wallet",
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to wallet",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    if (!wallet) return;
    
    try {
      await wallet.disconnect();
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

  return (
    <WalletContext.Provider value={{ wallet, connecting, connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};
