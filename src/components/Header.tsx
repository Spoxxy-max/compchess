
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { useWallet } from '../integrations/solana/wallet';
import { Loader2, WalletIcon } from 'lucide-react';
import WalletSelector from './WalletSelector';

interface HeaderProps {
  onNewGame: () => void;
  onJoinGame: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onNewGame, 
  onJoinGame, 
}) => {
  const { wallet, connecting, disconnectWallet } = useWallet();
  const [isWalletSelectorOpen, setIsWalletSelectorOpen] = useState(false);
  
  const isLoggedIn = wallet?.connected;
  const walletBalance = wallet?.balance;
  const walletName = wallet?.walletName;

  const handleOpenWalletSelector = () => {
    setIsWalletSelectorOpen(true);
  };
  
  return (
    <header className="w-full py-4 border-b border-border/30 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
      <div className="container px-4 mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          <span className="text-white">Comp</span>
          <span className="text-solana">Chess</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-secondary rounded-md flex items-center gap-2">
                  <WalletIcon className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:inline">{walletName}</span>
                  <span className="text-sm font-semibold">{walletBalance?.toFixed(2) || 0} SOL</span>
                </div>
                <Button 
                  onClick={onNewGame}
                  className="bg-solana hover:bg-solana-dark text-white"
                >
                  New Game
                </Button>
                <Button 
                  onClick={onJoinGame}
                  variant="outline"
                >
                  Join Game
                </Button>
                <Button
                  onClick={() => disconnectWallet()}
                  variant="ghost"
                  size="sm"
                >
                  Disconnect
                </Button>
              </div>
            </>
          ) : (
            <Button
              onClick={handleOpenWalletSelector}
              className="bg-solana hover:bg-solana-dark text-white"
              disabled={connecting}
            >
              {connecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <WalletIcon className="mr-2 h-4 w-4" />
                  Connect Wallet
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      <WalletSelector 
        isOpen={isWalletSelectorOpen}
        onClose={() => setIsWalletSelectorOpen(false)}
      />
    </header>
  );
};

export default Header;
