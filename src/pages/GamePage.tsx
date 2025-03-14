
import React, { useState, useEffect } from 'react';
import ChessBoard from '../components/ChessBoard';
import GameInfo from '../components/GameInfo';
import { createInitialBoard, formatTime, timeControlOptions } from '../utils/chessUtils';
import { ChessBoard as ChessBoardType, PieceColor, TimeControl } from '../utils/chessTypes';
import { useToast } from "@/hooks/use-toast";

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
    <div className="container px-4 mx-auto py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 flex justify-center items-start">
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
        
        <div className="w-full md:w-80">
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
  );
};

export default GamePage;
