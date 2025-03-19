
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../integrations/solana/wallet';
import WalletSelector from './WalletSelector';
import { Settings, WalletIcon, LogOut } from 'lucide-react';

interface HeaderProps {
  onNewGame?: () => void;
  onJoinGame?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNewGame, onJoinGame }) => {
  const { wallet, connectWallet, disconnectWallet } = useWallet();
  const [isWalletSelectorOpen, setIsWalletSelectorOpen] = useState(false);
  const navigate = useNavigate();

  // Navigate to home
  const handleNavHome = () => {
    navigate('/');
  };

  // Open wallet selection modal
  const handleConnectWallet = () => {
    setIsWalletSelectorOpen(true);
  };

  // Disconnect wallet and navigate home
  const handleDisconnectWallet = async () => {
    console.log("Disconnecting wallet...");
    try {
      await disconnectWallet();
      console.log("Wallet disconnected, navigating to home");
      navigate('/'); // Redirect to homepage after disconnect
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  return (
    <header className="py-4 px-6 bg-card border-b border-border flex items-center justify-between">
      <div className="flex items-center">
        <h1 
          className="text-xl font-bold mr-2 cursor-pointer hover:text-primary transition-colors" 
          onClick={handleNavHome}
        >
          CompChess
        </h1>
        <span className="text-sm text-muted-foreground">&#9812;</span>
      </div>
      
      <div className="flex items-center gap-2">
        {wallet?.connected ? (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              className="gap-2 hover:bg-muted active:scale-95 transition-all"
            >
              <WalletIcon className="w-4 h-4" />
              {wallet.publicKey?.substring(0, 4)}...{wallet.publicKey?.substring(wallet.publicKey.length - 4)}
            </Button>

            <Button 
              onClick={handleDisconnectWallet}
              variant="destructive"
              className="gap-2 hover:bg-red-500/20 active:scale-95 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleConnectWallet}
            className="bg-solana hover:bg-solana-dark gap-2 active:scale-95 transition-all duration-200 transform shadow-md hover:shadow-lg"
          >
            <WalletIcon className="w-4 h-4" />
            Connect Wallet
          </Button>
        )}
      </div>
      
      <WalletSelector 
        isOpen={isWalletSelectorOpen} 
        onClose={() => setIsWalletSelectorOpen(false)} 
      />
    </header>
  );
};

export default Header;
