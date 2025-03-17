import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ChessBoard from '../components/ChessBoard';
import { ChessBoard as ChessBoardType, ChessSquare, PieceColor } from '../utils/chessTypes';
import { createInitialBoard } from '../utils/chessUtils';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@/integrations/solana/wallet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

const GamePage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<any>(null);
  const [board, setBoard] = useState<ChessBoardType>(createInitialBoard());
  const [playerColor, setPlayerColor] = useState<PieceColor>('white');
  const [isLoading, setIsLoading] = useState(true);
  const [isSpectator, setIsSpectator] = useState(false);
  const { wallet } = useWallet();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Handle back to home
  const handleBackToHome = () => {
    navigate('/');
  };

  useEffect(() => {
    if (!gameId) return;

    const fetchGame = async () => {
      try {
        const { data, error } = await supabase
          .from('chess_games')
          .select('*')
          .eq('id', gameId)
          .single();

        if (error) throw error;
        
        if (data) {
          setGame(data);
          
          // Determine player color
          if (wallet?.publicKey) {
            if (data.host_id === wallet.publicKey) {
              setPlayerColor('white');
              setIsSpectator(false);
            } else if (data.opponent_id === wallet.publicKey) {
              setPlayerColor('black');
              setIsSpectator(false);
            } else {
              // User is not a player in this game
              setIsSpectator(true);
            }
          } else {
            // No wallet connected, user is a spectator
            setIsSpectator(true);
          }
          
          // Set board state
          if (data.board_state) {
            setBoard(data.board_state as ChessBoardType);
          }
        }
      } catch (error) {
        console.error('Error fetching game:', error);
        toast({
          title: 'Error',
          description: 'Failed to load the game',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchGame();
    
    // Subscribe to game changes
    const subscription = supabase
      .channel(`game_${gameId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'chess_games',
        filter: `id=eq.${gameId}`
      }, (payload) => {
        setGame(payload.new);
        setBoard(payload.new.board_state as ChessBoardType);
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [gameId, wallet?.publicKey, toast]);

  const handleMove = async (from: ChessSquare, to: ChessSquare) => {
    if (!gameId || !game || isSpectator) return;
    
    // Check if it's the player's turn
    const isPlayerTurn = (playerColor === 'white' && board.currentTurn === 'white') || 
                         (playerColor === 'black' && board.currentTurn === 'black');
                         
    if (!isPlayerTurn) {
      toast({
        description: "It's not your turn",
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // The move is already processed in the ChessBoard component
      // Here we just need to update the database
      const { error } = await supabase
        .from('chess_games')
        .update({
          board_state: board,
          current_turn: board.currentTurn,
          move_history: board.moveHistory
        })
        .eq('id', gameId);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error updating game:', error);
      toast({
        title: 'Error',
        description: 'Failed to update the game',
        variant: 'destructive',
      });
    }
  };

  const getGameStatusBadge = () => {
    if (!game) return null;
    
    switch (game.status) {
      case 'waiting':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Waiting for Opponent</Badge>;
      case 'active':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Game in Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Game Completed</Badge>;
      case 'aborted':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Game Aborted</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading game...</div>;
  }

  if (!game) {
    return <div className="flex justify-center items-center h-screen">Game not found</div>;
  }

  return (
    <div className="container mx-auto py-4 px-4 min-h-screen flex flex-col">
      <div className="mb-4 flex justify-between items-center">
        <Button 
          onClick={handleBackToHome}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Button>
        <div>
          {getGameStatusBadge()}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="flex-1 flex justify-center">
          <ChessBoard 
            playerColor={playerColor}
            onMove={handleMove}
            gameId={gameId}
            readOnly={isSpectator}
          />
        </div>
        
        <div className="w-full md:w-80 bg-card rounded-lg p-4 border border-border">
          <h2 className="text-lg font-semibold mb-4">Game Info</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Game ID</p>
              <p className="font-mono text-sm">{game.id}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Time Control</p>
              <p>{game.time_control}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Stake</p>
              <p>{game.stake} SOL</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">White Player</p>
              <p className="font-mono text-sm">
                {game.host_id.substring(0, 6)}...{game.host_id.substring(game.host_id.length - 4)}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Black Player</p>
              <p className="font-mono text-sm">
                {game.opponent_id 
                  ? `${game.opponent_id.substring(0, 6)}...${game.opponent_id.substring(game.opponent_id.length - 4)}`
                  : 'Waiting for opponent'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Current Turn</p>
              <p className="capitalize">{board.currentTurn}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Move History</p>
              <div className="max-h-40 overflow-y-auto bg-background p-2 rounded text-sm font-mono">
                {board.moveHistory.length > 0 
                  ? board.moveHistory.map((move, index) => (
                      <span key={index} className="mr-2">{move}</span>
                    ))
                  : 'No moves yet'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
