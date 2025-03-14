
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ChessBoard from '../components/ChessBoard';
import GameInfo from '../components/GameInfo';
import { createInitialBoard, formatTime, timeControlOptions } from '../utils/chessUtils';
import { ChessBoard as ChessBoardType, PieceColor, TimeControl } from '../utils/chessTypes';
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface GamePageProps {
  gameId?: string;
  timeControl: TimeControl;
  stake: number;
  playerColor?: PieceColor;
}

const GamePage: React.FC<GamePageProps> = ({ 
  gameId = "practice", 
  timeControl = timeControlOptions[0],
  stake = 0,
  playerColor = 'white'
}) => {
  const [board, setBoard] = useState<ChessBoardType>(createInitialBoard());
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get state from router if available
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
  }, [location]);

  useEffect(() => {
    // Initialize the game with the selected time control
    setBoard((prevBoard) => ({
      ...prevBoard,
      whiteTime: timeControl.startTime,
      blackTime: timeControl.startTime,
      isTimerRunning: true,
    }));

    toast({
      title: "Game Started",
      description: `${timeControl.label} - Stake: ${stake} SOL`,
    });

    // Start the game timer
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
  }, [timeControl, stake, toast]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background elements for futuristic look */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-solana/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-solana/15 rounded-full blur-[100px]" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(9,9,11,0.05)_0.1px,transparent_0.1px),linear-gradient(to_right,rgba(9,9,11,0.05)_0.1px,transparent_0.1px)] bg-[size:24px_24px] opacity-20" />
      
      <div className="container px-4 mx-auto py-4 sm:py-8">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 flex items-center gap-2"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={16} />
          Back to Home
        </Button>
        
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-8`}>
          <div className={`${isMobile ? 'w-full' : 'flex-1'} flex justify-center items-start`}>
            <ChessBoard 
              playerColor={playerColor}
              onMove={(from, to) => {
                // Add increment after move
                setBoard((prevBoard) => {
                  const updatedBoard = { ...prevBoard };
                  
                  // Add increment to the player who just moved
                  if (prevBoard.currentTurn === 'white') {
                    updatedBoard.blackTime += timeControl.increment;
                  } else {
                    updatedBoard.whiteTime += timeControl.increment;
                  }
                  
                  return updatedBoard;
                });
              }} 
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
    </div>
  );
};

export default GamePage;
