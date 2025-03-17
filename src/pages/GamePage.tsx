
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ChessBoard from '../components/ChessBoard';
import GameInfo from '../components/GameInfo';
import VictoryModal from '../components/VictoryModal';
import StakeConfirmationModal from '../components/StakeConfirmationModal';
import GameStartCountdown from '../components/GameStartCountdown';
import { createInitialBoard, formatTime, timeControlOptions } from '../utils/chessUtils';
import { ChessBoard as ChessBoardType, PieceColor, TimeControl } from '../utils/chessTypes';
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Header from '@/components/Header';
import { useWallet } from '../integrations/solana/wallet';
import { 
  createGame, 
  updateGameState, 
  endGame, 
  subscribeToGame, 
  GameData, 
  joinGame, 
  startGame,
  checkGameInactivity,
  abortGame
} from '../utils/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { chessGameContract, executeChessContractMethod } from '../integrations/solana/chessSmartContract';

interface GamePageProps {
  gameId?: string;
  timeControl: TimeControl;
  stake: number;
  playerColor?: PieceColor;
}

// Game states
type GameState = 'initializing' | 'waiting' | 'countdown' | 'playing' | 'completed' | 'aborted';

const GamePage: React.FC<GamePageProps> = ({ 
  gameId: propGameId,
  timeControl = timeControlOptions[0],
  stake = 0,
  playerColor = 'white'
}) => {
  // Game state
  const [board, setBoard] = useState<ChessBoardType>(createInitialBoard());
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [gameState, setGameState] = useState<GameState>('initializing');
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [stakeConfirmed, setStakeConfirmed] = useState(false);
  const [gameWinner, setGameWinner] = useState<'you' | string | null>(null);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [countdownComplete, setCountdownComplete] = useState(false);
  const [firstMoveMade, setFirstMoveMade] = useState(false);

  // Inactivity timer
  const inactivityCheckInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Router and UI hooks
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { wallet, smartContractExecute } = useWallet();
  const urlParams = useParams<{ id?: string }>();
  
  // Determine the actual game ID from props or URL
  const gameId = propGameId || urlParams.id || location.state?.gameId || "practice";
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
        // For game creator
        if (playerColor === 'white') {
          const result = await executeChessContractMethod('createGame', [stake, timeControl.startTime]);
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
        // For player joining the game
        else {
          const result = await executeChessContractMethod('joinGame', [gameId, stake]);
          if (result.success) {
            setStakeConfirmed(true);
            setShowStakeModal(false);
            
            toast({
              title: "Stake Confirmed",
              description: `Successfully staked ${stake} SOL to join this game`,
            });
          } else {
            toast({
              title: "Stake Failed",
              description: result.error?.message || "Failed to stake funds",
              variant: "destructive",
            });
          }
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
      initialBoard.isTimerRunning = false; // Don't start timer yet
      setBoard(initialBoard);
      setGameState('playing');
      
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
        initialBoard.isTimerRunning = false; // Timer starts after countdown
        
        createGame({
          hostId: wallet.publicKey,
          timeControl: timeControl.type,
          timeIncrement: timeControl.increment,
          stake: stake,
          initialBoard
        }).then(data => {
          if (data) {
            setBoard(initialBoard);
            setGameData(data);
            setGameState('waiting');
            
            // Redirect to the game page with the new game ID
            navigate(`/game/${data.id}`, { 
              replace: true,
              state: {
                timeControl,
                stake,
                playerColor: 'white'
              }
            });
            
            toast({
              title: "Game Created",
              description: `Waiting for an opponent to join`,
            });
            
            // Set up subscription to listen for opponent joining
            const subscription = subscribeToGame(data.id, (payload) => {
              const updatedGame = payload.new as GameData;
              
              // Check if opponent has joined
              if (updatedGame.opponent_id && updatedGame.status === 'active' && !opponentJoined) {
                setOpponentJoined(true);
                setGameState('countdown');
                toast({
                  title: "Opponent Joined",
                  description: "The game will start shortly!",
                });
              }
              
              // Update game data
              setGameData(updatedGame);
            });
            
            setSubscription(subscription);
          }
        });
      } else if (gameId !== 'practice') {
        // Load and join existing game
        // This would fetch the game from Supabase and set up realtime subscription
        setGameState('waiting');
        
        // First, join the game if user is joining
        if (playerColor === 'black' && wallet.publicKey) {
          joinGame(gameId, wallet.publicKey).then(success => {
            if (success) {
              setGameState('countdown');
              toast({
                title: "Joined Game",
                description: "Successfully joined the game. Starting countdown...",
              });
            } else {
              toast({
                title: "Join Failed",
                description: "Could not join the game. It may no longer be available.",
                variant: "destructive",
              });
              navigate('/');
            }
          });
        }
        
        // Set up subscription to listen for game updates
        const subscription = subscribeToGame(gameId, (payload) => {
          const updatedGame = payload.new as GameData;
          
          // Update game data
          setGameData(updatedGame);
          
          // Handle game state changes
          if (updatedGame.status === 'active' && !opponentJoined && updatedGame.opponent_id) {
            setOpponentJoined(true);
            setGameState('countdown');
          } else if (updatedGame.status === 'completed') {
            setGameState('completed');
            const isWinner = updatedGame.winner_id === wallet.publicKey;
            setGameWinner(isWinner ? 'you' : updatedGame.current_turn === 'white' ? 'black' : 'white');
            setShowVictoryModal(true);
          } else if (updatedGame.status === 'aborted') {
            setGameState('aborted');
            toast({
              title: "Game Aborted",
              description: "The game was aborted.",
              variant: "destructive",
            });
            navigate('/');
          }
        });
        
        setSubscription(subscription);
      }
    }
    
    // Cleanup function
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      
      if (inactivityCheckInterval.current) {
        clearInterval(inactivityCheckInterval.current);
      }
    };
  }, [gameId, wallet?.publicKey, stakeConfirmed, navigate]);

  // Handle countdown completion
  const handleCountdownComplete = useCallback(() => {
    setCountdownComplete(true);
    setGameState('playing');
    
    // Start the game in the database
    if (!isPracticeMode && gameData) {
      startGame(gameData.id);
    }
    
    // Start inactivity check for first move (30 second limit)
    if (!isPracticeMode && gameData && playerColor === 'black') {
      inactivityCheckInterval.current = setInterval(() => {
        checkGameInactivity(gameData.id).then(({ inactive }) => {
          if (inactive && !firstMoveMade) {
            // If inactive and first move not made, abort the game
            abortGame(gameData.id, 'inactivity').then(() => {
              toast({
                title: "Game Aborted",
                description: "White player did not make a move within 30 seconds.",
                variant: "destructive",
              });
              setGameState('aborted');
              navigate('/');
            });
            
            // Clear the interval
            if (inactivityCheckInterval.current) {
              clearInterval(inactivityCheckInterval.current);
              inactivityCheckInterval.current = null;
            }
          }
        });
      }, 5000); // Check every 5 seconds
    }
  }, [isPracticeMode, gameData, playerColor, navigate]);

  // Set up timer
  useEffect(() => {
    // Only start the timer when the game is in playing state and countdown is complete
    if (gameState === 'playing' && countdownComplete && board && stakeConfirmed) {
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
            setGameState('completed');
            
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
  }, [gameState, countdownComplete, isPracticeMode, gameData, toast, playerColor, stakeConfirmed]);

  // Handle piece movement
  const handleMove = useCallback((from, to) => {
    // The first move starts the timer
    if (!firstMoveMade) {
      setFirstMoveMade(true);
      
      // Start timer on first move
      setBoard(prevBoard => ({
        ...prevBoard,
        isTimerRunning: true
      }));
      
      // Clear inactivity check
      if (inactivityCheckInterval.current) {
        clearInterval(inactivityCheckInterval.current);
        inactivityCheckInterval.current = null;
      }
    }
    
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
        setGameState('completed');
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
  }, [isPracticeMode, gameData, timeControl, playerColor, showVictoryModal, firstMoveMade]);

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

    navigate('/');
  };

  // Render game content based on the current state
  const renderGameContent = () => {
    if (gameState === 'waiting') {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-8 bg-card/90 backdrop-blur rounded-lg border border-solana/20 shadow-xl max-w-md">
            <h2 className="text-2xl font-bold mb-4">Waiting for Opponent</h2>
            <p className="text-gray-400 mb-6">Share this game link with someone to play against</p>
            <div className="p-4 bg-background/50 rounded-md mb-6 font-mono text-sm break-all">
              {window.location.href}
            </div>
            <Button
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              variant="outline"
              className="w-full"
            >
              Copy Link
            </Button>
          </div>
        </div>
      );
    }
    
    if (gameState === 'countdown') {
      return (
        <div className="flex items-center justify-center h-full">
          <GameStartCountdown 
            playerColor={playerColor}
            onCountdownComplete={handleCountdownComplete}
            opponentName={gameData?.host_id.substring(0, 8) + '...' || 'Opponent'}
            stake={stake}
          />
        </div>
      );
    }
    
    return (
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-8 items-center justify-center flex-1`}>
        <div className={`${isMobile ? 'w-full' : 'flex-1'} flex justify-center items-start`}>
          <ChessBoard 
            playerColor={playerColor}
            gameId={gameId !== 'practice' ? gameId : undefined}
            onMove={handleMove}
            readOnly={gameState !== 'playing'}
          />
        </div>
        
        <div className={`${isMobile ? 'w-full mt-4' : 'w-80'}`}>
          <GameInfo 
            whiteTime={board.whiteTime} 
            blackTime={board.blackTime}
            currentTurn={board.currentTurn}
            capturedPieces={board.capturedPieces}
            moveHistory={board.moveHistory}
            gameOver={board.gameOver || gameState === 'completed' || gameState === 'aborted'}
            winner={board.winner}
            stake={stake}
          />
        </div>
      </div>
    );
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
        
        {renderGameContent()}
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
