
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import NewGameModal from '../components/NewGameModal';
import JoinGameModal from '../components/JoinGameModal';
import { TimeControl, TimeControlOption } from '../utils/chessTypes';
import { timeControlOptions } from '../utils/chessUtils';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Mock data for join game
const mockAvailableGames = [
  {
    id: 'game1',
    host: 'Player1',
    timeControl: timeControlOptions[0],
    stake: 0.1,
    createdAt: new Date(),
  },
  {
    id: 'game2',
    host: 'Player2',
    timeControl: timeControlOptions[1],
    stake: 0.5,
    createdAt: new Date(),
  },
];

const Index = () => {
  const [isNewGameModalOpen, setIsNewGameModalOpen] = useState(false);
  const [isJoinGameModalOpen, setIsJoinGameModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [walletBalance, setWalletBalance] = useState(5.0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleNewGame = () => {
    if (isLoggedIn) {
      setIsNewGameModalOpen(true);
    } else {
      toast({
        title: "Not Connected",
        description: "Please connect your wallet to create a game",
        variant: "destructive",
      });
    }
  };

  const handleJoinGame = () => {
    if (isLoggedIn) {
      setIsJoinGameModalOpen(true);
    } else {
      toast({
        title: "Not Connected",
        description: "Please connect your wallet to join a game",
        variant: "destructive",
      });
    }
  };

  const handleConnectWallet = () => {
    // Simulate connecting wallet
    setIsLoggedIn(true);
    toast({
      title: "Wallet Connected",
      description: "Successfully connected to Solana Devnet",
    });
  };

  const handleCreateGame = (timeControl: TimeControl, stake: number) => {
    // Navigate to the game page with the selected settings
    navigate('/game', { state: { timeControl, stake, playerColor: 'white' } });
  };

  const handleJoinGameSubmit = (gameId: string) => {
    // Find the selected game from mock data
    const selectedGame = mockAvailableGames.find(game => game.id === gameId);
    
    if (selectedGame) {
      navigate('/game', { 
        state: { 
          gameId,
          timeControl: selectedGame.timeControl,
          stake: selectedGame.stake,
          playerColor: 'black' 
        } 
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        onNewGame={handleNewGame}
        onJoinGame={handleJoinGame}
        isLoggedIn={isLoggedIn}
        onConnectWallet={handleConnectWallet}
        walletBalance={walletBalance}
      />
      
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-5xl w-full flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 text-left">
            <h1 className="text-4xl font-bold mb-4">
              Play Chess on <span className="text-solana">Solana</span>
            </h1>
            <p className="text-lg mb-6 text-gray-300">
              CompChess is a decentralized chess platform where you can challenge opponents 
              and compete for SOL stakes in secure, transparent matches.
            </p>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleNewGame}
                  className="bg-solana hover:bg-solana-dark text-white px-8 py-6"
                  size="lg"
                >
                  Create Game
                </Button>
                <Button 
                  onClick={handleJoinGame}
                  variant="outline"
                  className="px-8 py-6"
                  size="lg"
                >
                  Join Game
                </Button>
              </div>
              {!isLoggedIn && (
                <p className="text-sm text-gray-400 mt-2">
                  Connect your Solana wallet to create or join games with stakes
                </p>
              )}
            </div>
          </div>
          
          <div className="lg:w-1/2">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-solana rounded-lg blur opacity-30"></div>
              <div className="relative bg-card rounded-lg p-6 shadow-xl">
                <h2 className="text-xl font-semibold mb-4">Features</h2>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-solana-light mt-1 mr-3"></div>
                    <p>Challenge others to 1v1 matches with customizable time controls</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-solana-light mt-1 mr-3"></div>
                    <p>Stake SOL on games and compete for winnings</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-solana-light mt-1 mr-3"></div>
                    <p>Secure and transparent gameplay with Solana blockchain</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-solana-light mt-1 mr-3"></div>
                    <p>Choose from Blitz, Rapid, or Classical time controls</p>
                  </li>
                </ul>
                <div className="mt-6">
                  <Button 
                    onClick={() => navigate('/game', { 
                      state: { 
                        timeControl: timeControlOptions[0],
                        stake: 0,
                        gameId: 'practice'
                      } 
                    })}
                    variant="secondary"
                    className="w-full"
                  >
                    Play Practice Game (No Stakes)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <NewGameModal 
        isOpen={isNewGameModalOpen}
        onClose={() => setIsNewGameModalOpen(false)}
        onCreateGame={handleCreateGame}
      />
      
      <JoinGameModal 
        isOpen={isJoinGameModalOpen}
        onClose={() => setIsJoinGameModalOpen(false)}
        onJoinGame={handleJoinGameSubmit}
        availableGames={mockAvailableGames}
      />
    </div>
  );
};

export default Index;
