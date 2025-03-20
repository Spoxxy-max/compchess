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
import { chessGameContract, executeChessContractMethod, isIDLInitialized } from '../integrations/solana/chessSmartContract';

interface GamePageProps {
  gameId?: string;
  timeControl: TimeControl;
  stake: number;
  playerColor?: PieceColor;
}

type GameState = 'initializing' | 'waiting' | 'countdown' | 'playing' | 'completed' | 'aborted';

const GamePage: React.FC<GamePageProps> = ({ 
  gameId: propGameId,
  timeControl = timeControlOptions[0],
  stake = 0,
  playerColor = 'white'
}) => {
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
  const [transactionPending, setTransactionPending] = useState(false);
  
  const inactivityCheckInterval = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { wallet, smartContractExecute } = useWallet();
  const urlParams = useParams<{ id?: string }>();
  
  const gameId = propGameId || urlParams.id || location.state?.gameId || "practice";
  const isPracticeMode = gameId === "practice";

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
    
    if (stake > 0 && !isPracticeMode && !stakeConfirmed) {
      console.log("Showing stake modal for game with stake:", stake);
      setShowStakeModal(true);
    } else {
      setStakeConfirmed(true);
    }
  }, [location, isPracticeMode, stake, stakeConfirmed]);

  const handleStakeConfirm = async () => {
    try {
      console.log("Confirming stake of", stake, "SOL");
      setTransactionPending(true);
      
      if (!isIDLInitialized()) {
        toast({
          title: "IDL Not Initialized",
          description: "Please initialize the Chess Game IDL in the Smart Contract Config page first.",
          variant: "destructive",
        });
        navigate('/smart-contract');
        return;
      }
      
      if (wallet && wallet.connected) {
        console.log("Wallet balance:", wallet.balance, "SOL");
        
        if (wallet.balance < stake) {
          toast({
            title: "Insufficient Balance",
            description: `You need at least ${stake} SOL in your wallet to stake this game.`,
            variant: "destructive",
          });
          setTransactionPending(false);
          return;
        }
        
        if (playerColor === 'white') {
          const result = await executeChessContractMethod('createGame', [stake, timeControl.startTime]);
          if (result.success) {
            setStakeConfirmed(true);
            setShowStakeModal(false);
            
            const initialBoard = createInitialBoard();
            initialBoard.whiteTime = timeControl.startTime;
            initialBoard.blackTime = timeControl.startTime;
            initialBoard.isTimerRunning = false;
            
            const newGameData = await createGame({
              hostId: wallet.publicKey,
              timeControl: timeControl.type,
              timeIncrement: timeControl.increment,
              stake: stake,
              initialBoard
            });
            
            if (newGameData) {
              setBoard(initialBoard);
              setGameData(newGameData);
              setGameState('waiting');
              
              navigate(`/game/${newGameData.id}`, { 
                replace: true,
                state: {
                  timeControl,
                  stake,
                  playerColor: 'white'
                }
              });
              
              toast({
                title: "Game Created",
                description: `Successfully staked ${stake} SOL. Waiting for an opponent to join.`,
              });
              
              const subscription = subscribeToGame(newGameData.id, (payload) => {
                const updatedGame = payload.new as GameData;
                
                if (updatedGame.opponent_id && updatedGame.status === 'active' && !opponentJoined) {
                  setOpponentJoined(true);
                  setGameState('countdown');
                  toast({
                    title: "Opponent Joined",
                    description: "The game will start shortly!",
                  });
                }
                
                setGameData(updatedGame);
              });
              
              setSubscription(subscription);
            }
          } else {
            toast({
              title: "Stake Failed",
              description: result.error?.message || "Failed to stake funds",
              variant: "destructive",
            });
          }
        } 
        else {
          const result = await executeChessContractMethod('joinGame', [gameId, stake]);
          if (result.success) {
            setStakeConfirmed(true);
            setShowStakeModal(false);
            
            if (gameId !== 'practice') {
              const joinSuccess = await joinGame(gameId, wallet.publicKey);
              if (joinSuccess) {
                setGameState('countdown');
                toast({
                  title: "Joined Game",
                  description: `Successfully staked ${stake} SOL to join this game`,
                });
              } else {
                toast({
                  title: "Join Failed",
                  description: "Could not join the game in the database",
                  variant: "destructive",
                });
                navigate('/');
              }
            }
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
      console.error("Stake confirmation error:", error);
      toast({
        title: "Stake Error",
        description: error.message || "An error occurred when staking",
        variant: "destructive",
      });
    } finally {
      setTransactionPending(false);
    }
  };

  useEffect(() => {
    if (!stakeConfirmed) return;
    
    if (isPracticeMode) {
      const initialBoard = createInitialBoard();
      initialBoard.whiteTime = timeControl.startTime;
      initialBoard.blackTime = timeControl.startTime;
      initialBoard.isTimerRunning = false;
      setBoard(initialBoard);
      setGameState('playing');
      
      toast({
        title: "Practice Mode",
        description: `${timeControl.label} - Play against yourself to practice`,
      });
    } else if (gameId && wallet?.publicKey) {
      if (gameId === 'new' && wallet?.publicKey) {
        const initialBoard = createInitialBoard();
        initialBoard.whiteTime = timeControl.startTime;
        initialBoard.blackTime = timeControl.startTime;
        initialBoard.isTimerRunning = false;
        
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
            
            const subscription = subscribeToGame(data.id, (payload) => {
              const updatedGame = payload.new as GameData;
              
              if (updatedGame.opponent_id && updatedGame.status === 'active' && !opponentJoined) {
                setOpponentJoined(true);
                setGameState('countdown');
                toast({
                  title: "Opponent Joined",
                  description: "The game will start shortly!",
                });
              }
              
              setGameData(updatedGame);
            });
            
            setSubscription(subscription);
          }
        });
      } else if (gameId !== 'practice') {
        setGameState('waiting');
        
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
        
        const subscription = subscribeToGame(gameId, (payload) => {
          const updatedGame = payload.new as GameData;
          
          setGameData(updatedGame);
          
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
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      
      if (inactivityCheckInterval.current) {
        clearInterval(inactivityCheckInterval.current);
      }
    };
  }, [gameId, wallet?.publicKey, stakeConfirmed, navigate]);

  const handleCountdownComplete = useCallback(() => {
    setCountdownComplete(true);
    setGameState('playing');
    
    if (!isPracticeMode && gameData) {
      startGame(gameData.id);
    }
    
    if (!isPracticeMode && gameData && playerColor === 'black') {
      inactivityCheckInterval.current = setInterval(() => {
        checkGameInactivity(gameData.id).then(({ inactive }) => {
          if (inactive && !firstMoveMade) {
            abortGame(gameData.id, 'inactivity').then(() => {
              toast({
                title: "Game Aborted",
                description: "White player did not make a move within 30 seconds.",
                variant: "destructive",
              });
              setGameState('aborted');
              navigate('/');
            });
            
            if (inactivityCheckInterval.current) {
              clearInterval(inactivityCheckInterval.current);
              inactivityCheckInterval.current = null;
            }
          }
        });
      }, 5000);
    }
  }, [isPracticeMode, gameData, playerColor, navigate]);

  useEffect(() => {
    if (gameState === 'playing' && countdownComplete && board && stakeConfirmed) {
      const timer = setInterval(() => {
        setBoard((prevBoard) => {
          if (!prevBoard.isTimerRunning || prevBoard.gameOver) {
            return prevBoard;
          }

          const currentPlayerTime = prevBoard.currentTurn === 'white' ? prevBoard.whiteTime : prevBoard.blackTime;
          
          if (currentPlayerTime <= 0) {
            const winner = prevBoard.currentTurn === 'white' ? 'black' : 'white';
            
            if (!isPracticeMode && gameData) {
              endGame(gameData.id, winner === 'white' ? gameData.host_id : gameData.opponent_id || '');
            }
            
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

  const handleMove = useCallback((from, to) => {
    if (!firstMoveMade) {
      setFirstMoveMade(true);
      
      setBoard(prevBoard => ({
        ...prevBoard,
        isTimerRunning: true
      }));
      
      if (inactivityCheckInterval.current) {
        clearInterval(inactivityCheckInterval.current);
        inactivityCheckInterval.current = null;
      }
    }
    
    setBoard((prevBoard) => {
      const updatedBoard = { ...prevBoard };
      
      if (prevBoard.currentTurn === 'white') {
        updatedBoard.whiteTime += timeControl.increment;
      } else {
        updatedBoard.blackTime += timeControl.increment;
      }
      
      if (prevBoard.gameOver && !showVictoryModal) {
        setGameWinner(prevBoard.winner === playerColor ? 'you' : prevBoard.winner || null);
        setShowVictoryModal(true);
        setGameState('completed');
      }
      
      return updatedBoard;
    });

    if (!isPracticeMode && gameData) {
      setBoard(prevBoard => {
        updateGameState(gameData.id, prevBoard, prevBoard.moveHistory);
        return prevBoard;
      });
    }
  }, [isPracticeMode, gameData, timeControl, playerColor, showVictoryModal, firstMoveMade]);

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

  const handleBackToHome = () => {
    navigate('/');
  };

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
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-solana/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-solana/15 rounded-full blur-[100px]" />
      
      <div className="absolute inset-0 bg-[linear-gradient(rgba(9,9,11,0.05)_0.1px,transparent_0.1px),linear-gradient(to_right,rgba(9,9,11,0.05)_0.1px,transparent_0.1px)] bg-[size:24px_24px] opacity-20" />
      
      <Header
        onNewGame={handleNewGame}
        onJoinGame={handleJoinGame}
      />
      
      <div className="container px-4 mx-auto py-4 sm:py-8 flex-1 flex flex-col">
        <Button 
          size="sm" 
          className="mb-4 flex items-center gap-2 self-start"
          onClick={handleBackToHome}
        >
          <ArrowLeft size={16} />
          Back to Home
        </Button>
        
        {renderGameContent()}
      </div>
      
      <VictoryModal
        isOpen={showVictoryModal}
        onClose={() => setShowVictoryModal(false)}
        winner={gameWinner || ''}
        stake={stake}
      />
      
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
      
      {transactionPending && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-xl text-center">
            <div className="animate-spin w-10 h-10 border-4 border-solana border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Processing Transaction</h3>
            <p className="text-muted-foreground text-sm">Please confirm in your wallet...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;
