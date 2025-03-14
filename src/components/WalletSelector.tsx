
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWallet, WalletType } from '../integrations/solana/wallet';
import { Wallet, WalletIcon } from 'lucide-react';

interface WalletSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const getWalletIcon = (type: WalletType) => {
  // In a real app, we'd use actual wallet logos
  // For now, we'll just use the WalletIcon from lucide-react
  return <WalletIcon className="w-5 h-5" />;
};

const WalletSelector: React.FC<WalletSelectorProps> = ({ isOpen, onClose }) => {
  const { connectWallet, availableWallets } = useWallet();

  const handleSelectWallet = async (type: WalletType) => {
    try {
      await connectWallet(type);
      onClose();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Connect Wallet</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {availableWallets.map(wallet => (
            <Button
              key={wallet.type}
              variant="outline"
              className="flex justify-start items-center gap-3 p-4 h-auto hover:bg-secondary/50"
              onClick={() => handleSelectWallet(wallet.type)}
            >
              <div className="bg-solana/10 p-2 rounded-full">
                {getWalletIcon(wallet.type)}
              </div>
              <span className="font-medium">{wallet.name}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletSelector;
