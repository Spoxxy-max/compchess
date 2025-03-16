
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../integrations/solana/wallet';
import WalletSelector from './WalletSelector';
import { Settings, WalletIcon } from 'lucide-react';

interface HeaderProps {
  onNewGame?: () => void;
  onJoinGame?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNewGame, onJoinGame }) => {
  const { wallet, connectWallet, disconnectWallet } = useWallet();
  const [isWalletSelectorOpen, setIsWalletSelectorOpen] = useState(false);
  const navigate = useNavigate();

  // Handle wallet connect button click
  const handleConnectWallet = () => {
    setIsWalletSelectorOpen(true);
  };

  // Handle wallet disconnect button click
  const handleDisconnectWallet = () => {
    disconnectWallet();
  };

  // Navigate to the smart contract config page
  const handleSmartContractConfig = () => {
    navigate('/smart-contract');
  };

  // Navigate to home
  const handleNavigateHome = () => {
    navigate('/');
  };

  return (
    <header className="py-4 px-6 bg-card border-b border-border flex items-center justify-between">
      <div className="flex items-center">
        <h1 
          className="text-xl font-bold mr-2 cursor-pointer hover:text-primary transition-colors" 
          onClick={handleNavigateHome}
        >
          ChessNexus
        </h1>
        <span className="text-sm text-muted-foreground">Battle</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          onClick={handleSmartContractConfig}
          variant="outline"
          className="hidden sm:flex items-center gap-2 hover:bg-primary/10 active:scale-95 transition-all"
        >
          <Settings className="w-4 h-4" />
          Smart Contract
        </Button>
        
        {wallet?.connected ? (
          <Button 
            onClick={handleDisconnectWallet}
            variant="outline"
            className="gap-2 hover:bg-destructive/10 active:scale-95 transition-all"
          >
            <WalletIcon className="w-4 h-4" />
            {wallet.publicKey?.substring(0, 4)}...{wallet.publicKey?.substring(wallet.publicKey.length - 4)}
          </Button>
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
