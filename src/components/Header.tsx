
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

interface HeaderProps {
  onNewGame: () => void;
  onJoinGame: () => void;
  isLoggedIn: boolean;
  onConnectWallet: () => void;
  walletBalance?: number;
}

const Header: React.FC<HeaderProps> = ({ 
  onNewGame, 
  onJoinGame, 
  isLoggedIn, 
  onConnectWallet,
  walletBalance 
}) => {
  return (
    <header className="w-full py-4">
      <div className="container px-4 mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          <span className="text-white">Comp</span>
          <span className="text-solana">Chess</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-secondary rounded-md flex items-center">
                  <span className="text-sm font-semibold">{walletBalance || 0} SOL</span>
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
              </div>
            </>
          ) : (
            <Button
              onClick={onConnectWallet}
              className="bg-solana hover:bg-solana-dark text-white"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
