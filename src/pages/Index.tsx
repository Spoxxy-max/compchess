import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Available Chess Games</h1>
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
      
      <NewGameModal 
        isOpen={isNewGameModalOpen} 
        onClose={() => setIsNewGameModalOpen(false)}
        onSubmit={handleCreateGame}
      />
      
      <JoinGameModal
        isOpen={isJoinGameModalOpen && !!selectedGame}
        onClose={() => setIsJoinGameModalOpen(false)}
        game={selectedGame}
        onConfirm={handleJoinGame}
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
