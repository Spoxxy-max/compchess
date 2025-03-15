
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ChessBoard from '../components/ChessBoard';
import GameInfo from '../components/GameInfo';
import VictoryModal from '../components/VictoryModal';
import StakeConfirmationModal from '../components/StakeConfirmationModal';
import { createInitialBoard, formatTime, timeControlOptions } from '../utils/chessUtils';
import { ChessBoard as ChessBoardType, PieceColor, TimeControl } from '../utils/chessTypes';
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Header from '@/components/Header';
import { useWallet } from '../integrations/solana/wallet';
import { createGame, updateGameState, endGame, subscribeToGame, GameData } from '../utils/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

interface GamePageProps {
  gameId?: string;
  timeControl: TimeControl;
  stake: number;
  playerColor?: PieceColor;
}

const GamePage: React.FC<GamePageProps> = ({ 
  gameId: propGameId,
  timeControl = timeControlOptions[0],
  stake = 0,
  playerColor = 'white'
}) => {
  // Game state
  const [board, setBoard] = useState<ChessBoardType>(createInitialBoard());
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [stakeConfirmed, setStakeConfirmed] = useState(false);
  const [gameWinner, setGameWinner] = useState<'you' | string | null>(null);
  
  // Router and UI hooks
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { wallet, smartContractExecute } = useWallet();
  const urlParams = useParams<{ id?: string }>();
  
  // Determine the actual game ID from props or URL
  const gameId = propGameId || urlParams.id || "practice";
  const isPracticeMode = gameId === "practice";

  // Get game settings from location state if available
  useEffect(() => {
    if (location.state) {
      const { timeControl: routeTimeControl, stake: routeStake, playerColor: routePlayerColor } = location.state as any;
      
      if (routeTimeControl) {
        timeControl = routeTimeControl;
      }
      
      if (typeof routeStake === 'number') {
        stake = routeStake;
      }
      
      if (routePlayerColor) {
        playerColor = routePlayerColor;
      }
    }
    
    // Show stake confirmation modal if there's a non-zero stake
    if (stake > 0 && !isPracticeMode) {
      setShowStakeModal(true);
    } else {
      setStakeConfirmed(true);
    }
  }, [location]);

  // Handle stake confirmation
  const handleStakeConfirm = async () => {
    try {
      // Call smart contract to handle the stake
      if (wallet && wallet.connected) {
        const result = await smartContractExecute('createGame', [stake, timeControl.startTime]);
        if (result.success) {
          setStakeConfirmed(true);
          setShowStakeModal(false);
          
          toast({
            title: "Stake Confirmed",
            description: `Successfully staked ${stake} SOL on this game`,
          });
        } else {
          toast({
            title: "Stake Failed",
            description: result.error?.message || "Failed to stake funds",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Stake Error",
        description: error.message || "An error occurred when staking",
        variant: "destructive",
      });
    }
  };

  // Create or load the game
  useEffect(() => {
    if (!stakeConfirmed) return;
    
    if (isPracticeMode) {
      // Initialize practice mode with the selected time control
      const initialBoard = createInitialBoard();
      initialBoard.whiteTime = timeControl.startTime;
      initialBoard.blackTime = timeControl.startTime;
      initialBoard.isTimerRunning = true;
      setBoard(initialBoard);
      
      toast({
        title: "Practice Mode",
        description: `${timeControl.label} - Play against yourself to practice`,
      });
    } else if (gameId && wallet?.publicKey) {
      // Real game mode - either create or load a game
      if (gameId === 'new' && wallet?.publicKey) {
        // Create a new game
        const initialBoard = createInitialBoard();
        initialBoard.whiteTime = timeControl.startTime;
        initialBoard.blackTime = timeControl.startTime;
        
        createGame({
          hostId: wallet.publicKey,
          timeControl: timeControl.type,
          timeIncrement: timeControl.increment,
          stake: stake,
          initialBoard
        }).then(data => {
          if (data) {
            setGameData(data);
            // Redirect to the game page with the new game ID
            navigate(`/game/${data.id}`, { replace: true });
            
            toast({
              title: "Game Created",
              description: `Waiting for an opponent to join`,
            });
          }
        });
      } else {
        // Load existing game
        // This would fetch the game from Supabase and set up realtime subscription
        // For now, we'll use practice mode settings
        const initialBoard = createInitialBoard();
        initialBoard.whiteTime = timeControl.startTime;
        initialBoard.blackTime = timeControl.startTime;
        initialBoard.isTimerRunning = true;
        setBoard(initialBoard);
      }
    }
  }, [gameId, wallet?.publicKey, stakeConfirmed]);

  // Set up timer
  useEffect(() => {
    // Only start the timer in practice mode or if the game is active
    if ((isPracticeMode || (gameData && gameData.status === 'active')) && stakeConfirmed) {
      const timer = setInterval(() => {
        setBoard((prevBoard) => {
          if (!prevBoard.isTimerRunning || prevBoard.gameOver) {
            return prevBoard;
          }

          const currentPlayerTime = prevBoard.currentTurn === 'white' ? prevBoard.whiteTime : prevBoard.blackTime;
          
          // Check if time has run out
          if (currentPlayerTime <= 0) {
            // Game over due to timeout
            const winner = prevBoard.currentTurn === 'white' ? 'black' : 'white';
            
            // Update the game in Supabase if it's not practice mode
            if (!isPracticeMode && gameData) {
              endGame(gameData.id, winner === 'white' ? gameData.host_id : gameData.opponent_id || '');
            }
            
            // Show victory modal
            setGameWinner(winner === playerColor ? 'you' : winner);
            setShowVictoryModal(true);
            
            toast({
              title: "Time's Up!",
              description: `${prevBoard.currentTurn} ran out of time. ${winner} wins!`,
              variant: "destructive",
            });
            
            return {
              ...prevBoard,
              isTimerRunning: false,
              gameOver: true,
              winner: winner,
            };
          }

          // Update the timer for the current player
          if (prevBoard.currentTurn === 'white') {
            return {
              ...prevBoard,
              whiteTime: prevBoard.whiteTime - 1,
            };
          } else {
            return {
              ...prevBoard,
              blackTime: prevBoard.blackTime - 1,
            };
          }
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isPracticeMode, gameData, toast, playerColor, stakeConfirmed]);

  // Handle piece movement
  const handleMove = useCallback((from, to) => {
    // Add increment after move
    setBoard((prevBoard) => {
      const updatedBoard = { ...prevBoard };
      
      // Add increment to the player who just moved
      if (prevBoard.currentTurn === 'white') {
        updatedBoard.blackTime += timeControl.increment;
      } else {
        updatedBoard.whiteTime += timeControl.increment;
      }
      
      // Check for game end conditions like checkmate
      if (prevBoard.gameOver && !showVictoryModal) {
        setGameWinner(prevBoard.winner === playerColor ? 'you' : prevBoard.winner || null);
        setShowVictoryModal(true);
      }
      
      return updatedBoard;
    });

    // If this is a real game, update the game state in Supabase
    if (!isPracticeMode && gameData) {
      setBoard(prevBoard => {
        updateGameState(gameData.id, prevBoard, prevBoard.moveHistory);
        return prevBoard;
      });
    }
  }, [isPracticeMode, gameData, timeControl, playerColor, showVictoryModal]);

  // Handle new game creation
  const handleNewGame = () => {
    if (!wallet?.connected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create a game",
        variant: "destructive",
      });
      return;
    }

    navigate('/game/new', { 
      state: { 
        timeControl: timeControlOptions[0],
        stake: 0
      }
    });
  };
  
  // Handle joining a game
  const handleJoinGame = () => {
    if (!wallet?.connected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to join a game",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Coming Soon",
      description: "This feature is not yet fully implemented",
    });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background elements for futuristic look */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-solana/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-solana/15 rounded-full blur-[100px]" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(9,9,11,0.05)_0.1px,transparent_0.1px),linear-gradient(to_right,rgba(9,9,11,0.05)_0.1px,transparent_0.1px)] bg-[size:24px_24px] opacity-20" />
      
      <Header
        onNewGame={handleNewGame}
        onJoinGame={handleJoinGame}
      />
      
      <div className="container px-4 mx-auto py-4 sm:py-8 flex-1 flex flex-col">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 flex items-center gap-2 self-start"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={16} />
          Back to Home
        </Button>
        
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-8 items-center justify-center flex-1`}>
          <div className={`${isMobile ? 'w-full' : 'flex-1'} flex justify-center items-start`}>
            <ChessBoard 
              playerColor={playerColor}
              gameId={gameId !== 'practice' ? gameId : undefined}
              onMove={handleMove}
            />
          </div>
          
          <div className={`${isMobile ? 'w-full mt-4' : 'w-80'}`}>
            <GameInfo 
              whiteTime={board.whiteTime} 
              blackTime={board.blackTime}
              currentTurn={board.currentTurn}
              capturedPieces={board.capturedPieces}
              moveHistory={board.moveHistory}
              gameOver={board.gameOver}
              winner={board.winner}
              stake={stake}
            />
          </div>
        </div>
      </div>
      
      {/* Victory Modal */}
      <VictoryModal
        isOpen={showVictoryModal}
        onClose={() => setShowVictoryModal(false)}
        winner={gameWinner || ''}
        stake={stake}
      />
      
      {/* Stake Confirmation Modal */}
      <StakeConfirmationModal
        isOpen={showStakeModal}
        onClose={() => {
          setShowStakeModal(false);
          if (stake > 0 && !isPracticeMode) {
            navigate('/');
          }
        }}
        onConfirm={handleStakeConfirm}
        stake={stake}
        timeControl={timeControl.label}
      />
    </div>
  );
};

export default GamePage;
