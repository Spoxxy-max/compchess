
import React from 'react';
import { WalletIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { WalletType } from '@/integrations/solana/walletTypes';

interface MobileWalletOptionsProps {
  detectedMobileWallets: { type: WalletType; name: string }[];
  onConnectWallet: (type?: string) => void;
  walletConnecting: boolean;
}

const MobileWalletOptions: React.FC<MobileWalletOptionsProps> = ({
  detectedMobileWallets,
  onConnectWallet,
  walletConnecting
}) => {
  return (
    <div className="mt-4 space-y-3">
      <h3 className="text-sm font-medium text-gray-300">Connect with:</h3>
      <div className="grid grid-cols-2 gap-2">
        {(detectedMobileWallets && detectedMobileWallets.length > 0) ? (
          detectedMobileWallets.map((walletInfo) => (
            <Button 
              key={walletInfo.type}
              variant="outline" 
              className="flex items-center justify-center space-x-2 h-12"
              onClick={() => onConnectWallet(walletInfo.type)}
              disabled={walletConnecting}
            >
              <WalletIcon className="h-4 w-4" />
              <span>{walletInfo.name}</span>
            </Button>
          ))
        ) : (
          <>
            <Button 
              variant="outline" 
              className="flex items-center justify-center space-x-2 h-12"
              onClick={() => onConnectWallet('phantom')}
              disabled={walletConnecting}
            >
              <WalletIcon className="h-4 w-4" />
              <span>Phantom</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center justify-center space-x-2 h-12"
              onClick={() => onConnectWallet('solflare')}
              disabled={walletConnecting}
            >
              <WalletIcon className="h-4 w-4" />
              <span>Solflare</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default MobileWalletOptions;
