
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  WalletContext, 
  WalletAdapter, 
  WalletType,
  createWallet,
  getAvailableWallets
} from '../integrations/solana/wallet';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

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
    
    const lastWalletType = localStorage.getItem('lastWalletType') as WalletType | undefined;
    if (lastWalletType) {
      connectWallet(lastWalletType).catch(err => {
        console.log('Failed to auto-connect wallet:', err);
      });
    }
  }, []);

  // Store wallet address in database
  const storeWalletAddress = async (walletAddress: string) => {
    try {
      // Check if the wallet already exists in our database
      const { data: existingWallet, error: queryError } = await supabase
        .from('wallet_profiles')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (queryError && queryError.code !== 'PGRST116') {
        console.error('Error checking existing wallet:', queryError);
        return;
      }

      // If wallet doesn't exist, add it to the database
      if (!existingWallet) {
        const { error: insertError } = await supabase
          .from('wallet_profiles')
          .insert({ wallet_address: walletAddress, connected_at: new Date().toISOString() });

        if (insertError) {
          console.error('Error storing wallet address:', insertError);
        } else {
          console.log('Wallet address stored successfully');
        }
      } else {
        // Update the last connected timestamp
        const { error: updateError } = await supabase
          .from('wallet_profiles')
          .update({ connected_at: new Date().toISOString() })
          .eq('wallet_address', walletAddress);

        if (updateError) {
          console.error('Error updating wallet timestamp:', updateError);
        } else {
          console.log('Wallet last connected timestamp updated');
        }
      }
    } catch (error) {
      console.error('Error in storeWalletAddress:', error);
    }
  };

  const connectWallet = async (type?: WalletType): Promise<WalletAdapter | void> => {
    if (connecting) return;
    
    try {
      setConnecting(true);
      
      const newWallet = createWallet(type);
      
      await newWallet.connect();
      
      setWallet(newWallet);
      if (type) localStorage.setItem('lastWalletType', type);
      
      toast({
        title: `${newWallet.walletName} Connected`,
        description: "Successfully connected to your Solana wallet",
      });

      // Store wallet address in database
      if (newWallet.publicKey) {
        storeWalletAddress(newWallet.publicKey);
      }
      
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

  return (
    <WalletContext.Provider 
      value={{ 
        wallet, 
        connecting, 
        availableWallets,
        connectWallet, 
        disconnectWallet,
        signTransaction: async (transaction) => {
          if (!wallet) throw new Error('Wallet not connected');
          return wallet.signTransaction(transaction);
        },
        signAllTransactions: async (transactions) => {
          if (!wallet) throw new Error('Wallet not connected');
          return wallet.signAllTransactions(transactions);
        }
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
