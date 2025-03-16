
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useWallet } from '../integrations/solana/wallet';

const Header = ({ onNewGame, onJoinGame }: { onNewGame: () => void, onJoinGame: () => void }) => {
  const { wallet, connectWallet, disconnectWallet } = useWallet();
  const isLoggedIn = wallet?.connected;

  // Fix the type error by creating a proper event handler
  const handleConnectWallet = () => {
    connectWallet();
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
  };

  return (
    <header className="bg-card/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="text-2xl font-bold text-white">
          CompChess
        </Link>
        
        <nav className="flex items-center space-x-4">
          <Link 
            to="/smart-contract" 
            className="text-gray-400 hover:text-white transition-colors px-3 py-2 text-sm"
          >
            Smart Contract
          </Link>
          {isLoggedIn ? (
            <>
              <Button variant="outline" size="sm" onClick={handleDisconnectWallet}>
                Disconnect Wallet
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={handleConnectWallet} className="bg-solana hover:bg-solana-dark text-white">
              Connect Wallet
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
