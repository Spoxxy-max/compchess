import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWallet, WalletType } from '../integrations/solana/wallet';
import { AlertCircle, WalletIcon, Smartphone } from 'lucide-react';

interface WalletSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletSelector: React.FC<WalletSelectorProps> = ({ isOpen, onClose }) => {
  const { connectWallet, availableWallets, connecting } = useWallet();
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Wallet brands and their corresponding styling
  const walletStyles: Record<WalletType, { bg: string, border: string, iconColor: string }> = {
    'phantom': { bg: 'bg-purple-500/10', border: 'border-purple-500/20', iconColor: 'text-purple-500' },
    'solflare': { bg: 'bg-orange-500/10', border: 'border-orange-500/20', iconColor: 'text-orange-500' },
    'trustwallet': { bg: 'bg-blue-500/10', border: 'border-blue-500/20', iconColor: 'text-blue-500' },
    'backpack': { bg: 'bg-green-500/10', border: 'border-green-500/20', iconColor: 'text-green-500' },
    'glow': { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', iconColor: 'text-yellow-500' },
    'coinbase': { bg: 'bg-blue-500/10', border: 'border-blue-500/20', iconColor: 'text-blue-500' },
  };

  const handleSelectWallet = async (type: WalletType) => {
    try {
      await connectWallet(type);
      onClose();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      // Keep dialog open if there's an error to allow user to try again
    }
  };

  const getWalletIcon = (type: WalletType) => {
    return (
      <div className={`p-2 rounded-full ${walletStyles[type]?.bg || 'bg-solana/10'}`}>
        <WalletIcon className={`w-5 h-5 ${walletStyles[type]?.iconColor || 'text-solana'}`} />
      </div>
    );
  };

  // Always show these wallet options on mobile
  const mobileWalletOptions = [
    { type: 'phantom' as WalletType, name: 'Phantom' },
    { type: 'solflare' as WalletType, name: 'Solflare' },
    { type: 'trustwallet' as WalletType, name: 'Trust Wallet' },
    { type: 'backpack' as WalletType, name: 'Backpack' },
  ];

  // Use available wallets for desktop, or the predefined list for mobile
  const walletsToShow = isMobile 
    ? mobileWalletOptions
    : (availableWallets.length > 0 ? availableWallets : mobileWalletOptions);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Connect Wallet hel</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {isMobile && (
            <div className="mb-2 p-2 bg-amber-500/10 rounded-md flex items-center gap-2 text-amber-500 text-sm">
              <Smartphone className="w-4 h-4" />
              <span>You'll be redirected to your wallet app</span>
            </div>
          )}
          
          {walletsToShow.map(wallet => (
            <Button
              key={wallet.type}
              variant="outline"
              className={`flex justify-start items-center gap-3 p-4 h-auto hover:bg-secondary/50 border ${walletStyles[wallet.type]?.border || 'border-border'}`}
              onClick={() => handleSelectWallet(wallet.type)}
              disabled={connecting}
            >
              {getWalletIcon(wallet.type)}
              <span className="font-medium">{wallet.name}</span>
            </Button>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground text-center pt-2">
          By connecting your wallet, you agree to the Terms of Service and Privacy Policy
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletSelector;
