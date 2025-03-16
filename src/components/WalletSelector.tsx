import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWallet, WalletType } from '../integrations/solana/wallet';
import { AlertCircle, WalletIcon } from 'lucide-react';

interface WalletSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletSelector: React.FC<WalletSelectorProps> = ({ isOpen, onClose }) => {
  const { connectWallet, availableWallets, connecting } = useWallet();

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Connect Wallet</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {availableWallets.length > 0 ? (
            availableWallets.map(wallet => (
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
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 text-muted-foreground">
              <AlertCircle className="w-10 h-10" />
              <p>No Solana wallets detected in your browser</p>
              <p className="text-sm">Please install a Solana wallet extension like Phantom or Solflare</p>
            </div>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground text-center pt-2">
          By connecting your wallet, you agree to the Terms of Service and Privacy Policy
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletSelector;
