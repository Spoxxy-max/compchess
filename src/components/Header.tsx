
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../integrations/solana/wallet';
import WalletSelector from './WalletSelector'
import { Settings, WalletIcon } from 'lucide-react'
import { ConnectWalletButton } from '@/providers/WalletContex';

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
// helllo
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
          CompChess
        </h1>
        <span className="text-sm text-muted-foreground">&#9812;</span>
      </div>

      <div className="flex items-center gap-2">
        <ConnectWalletButton />
      </div>
    </header>
  );
};

export default Header;
