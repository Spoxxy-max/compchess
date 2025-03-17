
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../integrations/solana/wallet';
import { createGame, joinGame, getAvailableGames } from '@/utils/supabaseClient';
import { createInitialBoard } from '@/utils/chessUtils';
import { getTimeControlInSeconds } from '@/utils/gameUtils';
import NewGameModal from '@/components/NewGameModal';
import JoinGameModal from '@/components/JoinGameModal';
import StakeConfirmationModal from '@/components/StakeConfirmationModal';
import { GameData } from '@/utils/supabaseClient';
import NewGameSuccessModal from '@/components/NewGameSuccessModal';
import IDLLoader from '@/components/IDLLoader';
import { Rocket, Gamepad, Shield, TrendingUp } from 'lucide-react';

const IndexPage = () => {
  const { wallet } = useWallet();
  const [availableGames, setAvailableGames] = useState<GameData[]>([]);
  const [isNewGameModalOpen, setIsNewGameModalOpen] = useState(false);
  const [isJoinGameModalOpen, setIsJoinGameModalOpen] = useState(false);
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showNewGameSuccess, setShowNewGameSuccess] = useState(false);
  const [createdGameId, setCreatedGameId] = useState('');
  const [createdGameStake, setCreatedGameStake] = useState(0);
  const [showIDLLoader, setShowIDLLoader] = useState(false);

  useEffect(() => {
    fetchAvailableGames();
  }, [wallet?.publicKey]);

  const fetchAvailableGames = async () => {
    setIsLoading(true);
    try {
      const games = await getAvailableGames(wallet?.publicKey);
      setAvailableGames(games);
    } catch (error: any) {
      console.error('Error fetching available games:', error);
      toast({
        title: "Error fetching games",
        description: error.message || "Failed to retrieve available games",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenNewGameModal = () => {
    setIsNewGameModalOpen(true);
  };

  const handleJoinGame = (game: GameData) => {
    setSelectedGame(game);
    setIsJoinGameModalOpen(true);
  };

  const handleConfirmJoin = async () => {
    if (!selectedGame) return;

    setIsJoinGameModalOpen(false);
    setIsStakeModalOpen(true);
  };

  const handleConfirmStake = async () => {
    if (!selectedGame || !wallet?.publicKey) return;

    setIsStakeModalOpen(false);
    setIsLoading(true);

    try {
      const success = await joinGame(selectedGame.id, wallet.publicKey);
      if (success) {
        toast({
          title: "Game Joined",
          description: "You have successfully joined the game!",
        });
        navigate(`/game/${selectedGame.id}`);
      } else {
        toast({
          title: "Failed to Join",
          description: "Could not join the selected game.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error joining game:', error);
      toast({
        title: "Error joining game",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGame = async (gameParams: {
    timeControl: string;
    timeIncrement: number;
    stake: number;
  }) => {
    if (!wallet?.connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a game",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const initialBoard = createInitialBoard();
      initialBoard.whiteTime = getTimeControlInSeconds(gameParams.timeControl) * 1000; // Convert to ms
      initialBoard.blackTime = initialBoard.whiteTime;
      
      const newGame = await createGame({
        hostId: wallet.publicKey!,
        timeControl: gameParams.timeControl,
        timeIncrement: gameParams.timeIncrement,
        stake: gameParams.stake,
        initialBoard,
      });
      
      if (newGame) {
        setCreatedGameId(newGame.id);
        setCreatedGameStake(gameParams.stake);
        setShowNewGameSuccess(true);
        setIsNewGameModalOpen(false);
        
        fetchAvailableGames();
      } else {
        toast({
          title: "Error creating game",
          description: "Failed to create a new chess game",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error creating game:', error);
      toast({
        title: "Error creating game",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleIDLLoader = () => {
    setShowIDLLoader(!showIDLLoader);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-900/80 via-black to-black p-8 my-8">
        <div className="grid-pattern-bg absolute inset-0"></div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              CompChess: Chess on Blockchain
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-6">
              Play competitive chess with secure on-chain staking. Challenge opponents, stake SOL, and win rewards for your chess skills.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleOpenNewGameModal}
                className="bg-solana hover:bg-solana/90 text-white px-6 py-2 rounded-lg shadow-glow-sm hover:shadow-glow-md transition-all duration-300"
                size="lg"
              >
                Create New Game
              </Button>
              <Button 
                onClick={toggleIDLLoader} 
                variant="outline" 
                size="lg"
                className="border-purple-500/50 hover:bg-purple-500/10"
              >
                {showIDLLoader ? "Hide IDL Loader" : "Load Smart Contract IDL"}
              </Button>
            </div>
          </div>
          <div className="w-full max-w-md">
            <div className="relative animate-float">
              <img 
                src="/images/pieces/white-king.svg" 
                alt="Chess King" 
                className="w-full h-auto max-w-[200px] mx-auto drop-shadow-glow"
              />
            </div>
          </div>
        </div>
      </div>

      {showIDLLoader && (
        <div className="mb-8">
          <IDLLoader />
        </div>
      )}

      {/* Features Section */}
      <div className="my-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card/80 backdrop-blur-md border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300">
            <CardHeader className="pb-2">
              <Gamepad className="h-8 w-8 text-purple-400 mb-2" />
              <CardTitle>Play Chess</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">Full-featured chess with time controls, move validation, and game history.</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/80 backdrop-blur-md border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300">
            <CardHeader className="pb-2">
              <TrendingUp className="h-8 w-8 text-emerald-400 mb-2" />
              <CardTitle>Stake SOL</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">Stake Solana on your games. Winners receive the full staked amount securely.</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/80 backdrop-blur-md border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300">
            <CardHeader className="pb-2">
              <Shield className="h-8 w-8 text-blue-400 mb-2" />
              <CardTitle>Secure</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">All games and stakes are secured by Solana blockchain smart contracts.</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/80 backdrop-blur-md border border-amber-500/20 hover:border-amber-500/50 transition-all duration-300">
            <CardHeader className="pb-2">
              <Rocket className="h-8 w-8 text-amber-400 mb-2" />
              <CardTitle>Fast</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">Lightning-fast moves and transactions thanks to Solana's high performance.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Available Games Section */}
      <div className="my-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Available Chess Games</h2>
          <Button onClick={handleOpenNewGameModal}>Create New Game</Button>
        </div>

        {isLoading ? (
          <p>Loading available games...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableGames.length > 0 ? (
              availableGames.map((game) => (
                <Card key={game.id} className="bg-card text-card-foreground shadow-md hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle>Game ID: {game.id.substring(0, 8)}...</CardTitle>
                    <CardDescription>
                      Stake: {game.stake} SOL - Time Control: {game.time_control}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Host: {game.host_id.substring(0, 8)}...</p>
                    <Button onClick={() => handleJoinGame(game)} className="w-full mt-4">
                      Join Game
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p>No available games. Create one to get started!</p>
            )}
          </div>
        )}
      </div>
      
      <NewGameModal 
        isOpen={isNewGameModalOpen} 
        onClose={() => setIsNewGameModalOpen(false)}
        onSubmit={handleCreateGame}
      />
      
      <JoinGameModal
        isOpen={isJoinGameModalOpen && !!selectedGame}
        onClose={() => setIsJoinGameModalOpen(false)}
        game={selectedGame}
        onConfirm={handleConfirmJoin}
      />
      
      <StakeConfirmationModal
        isOpen={isStakeModalOpen && !!selectedGame}
        onClose={() => setIsStakeModalOpen(false)}
        stake={selectedGame?.stake || 0}
        onConfirm={handleConfirmStake}
      />
      
      <NewGameSuccessModal
        isOpen={showNewGameSuccess}
        onClose={() => setShowNewGameSuccess(false)}
        gameId={createdGameId}
        stake={createdGameStake}
      />
    </div>
  );
};

export default IndexPage;
