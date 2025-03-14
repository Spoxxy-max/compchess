
import React, { useEffect, useState } from 'react';
import { ChessBoard as ChessBoardType, ChessSquare, PieceColor } from '../utils/chessTypes';
import { createInitialBoard, getValidMoves } from '../utils/chessUtils';
import ChessPieceComponent from './ChessPiece';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChessBoardProps {
  playerColor?: PieceColor;
  onMove?: (from: ChessSquare, to: ChessSquare) => void;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ playerColor = 'white', onMove }) => {
  const [board, setBoard] = useState<ChessBoardType>(createInitialBoard());
  const [flipped, setFlipped] = useState(playerColor === 'black');
  const [boardSize, setBoardSize] = useState('95vw');
  const isMobile = useIsMobile();

  // Responsive board size calculation
  useEffect(() => {
    const calculateBoardSize = () => {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const headerHeight = 80; // Approximate header height
      const infoHeight = isMobile ? 300 : 0; // Height of info panel if it's shown below on mobile
      const padding = 48; // Some padding

      const availableHeight = viewportHeight - headerHeight - infoHeight - padding;
      const maxWidth = isMobile ? viewportWidth - 32 : Math.min(600, viewportWidth * 0.5);
      
      // Use the smaller of available height or maxWidth to ensure square aspect ratio
      const size = Math.min(availableHeight, maxWidth);
      
      setBoardSize(`${size}px`);
    };

    calculateBoardSize();
    window.addEventListener('resize', calculateBoardSize);
    
    return () => {
      window.removeEventListener('resize', calculateBoardSize);
    };
  }, [isMobile]);

  const handleSquareClick = (square: ChessSquare) => {
    if (board.gameOver) return;
    
    // If it's not the player's turn, do nothing
    if (board.currentTurn !== playerColor) return;

    // If a piece is already selected
    if (board.selectedSquare) {
      // Check if the clicked square is a valid move
      const isValidMove = board.validMoves.some(
        (move) => move.row === square.row && move.col === square.col
      );

      if (isValidMove) {
        // Move the piece
        const newBoard = { ...board };
        const from = board.selectedSquare;
        const to = square;

        // Capture piece if any
        if (to.piece) {
          newBoard.capturedPieces.push({ ...to.piece });
        }

        // Move piece
        to.piece = from.piece;
        from.piece = null;

        // Update board state
        newBoard.currentTurn = board.currentTurn === 'white' ? 'black' : 'white';
        newBoard.selectedSquare = null;
        newBoard.validMoves = [];

        // Record move in algebraic notation (simplified)
        const files = 'abcdefgh';
        const moveNotation = `${files[from.col]}${8 - from.row}${to.piece ? 'x' : '-'}${files[to.col]}${8 - to.row}`;
        newBoard.moveHistory.push(moveNotation);

        setBoard(newBoard);

        // Notify parent component
        if (onMove) {
          onMove(board.selectedSquare, square);
        }
      } else if (square.piece && square.piece.color === playerColor) {
        // Select a new piece
        const newValidMoves = getValidMoves(board, square);
        setBoard({
          ...board,
          selectedSquare: square,
          validMoves: newValidMoves,
        });
      } else {
        // Deselect current piece
        setBoard({
          ...board,
          selectedSquare: null,
          validMoves: [],
        });
      }
    } else if (square.piece && square.piece.color === playerColor) {
      // Select piece
      const validMoves = getValidMoves(board, square);
      setBoard({
        ...board,
        selectedSquare: square,
        validMoves,
      });
    }
  };

  const renderSquare = (square: ChessSquare, isSelected: boolean, isValidMove: boolean) => {
    const isLight = (square.row + square.col) % 2 === 0;
    const classes = [
      'chess-square',
      isLight ? 'chess-square-light' : 'chess-square-dark',
      'relative',
      'flex',
      'items-center',
      'justify-center',
      'w-full',
      'h-full',
    ];

    if (isSelected) {
      classes.push('ring-2 ring-solana ring-inset');
    }

    if (isValidMove) {
      if (square.piece) {
        // Capture indicator
        classes.push('ring-2 ring-red-500 ring-inset');
      } else {
        // Move indicator
        classes.push('before:content-[""]');
        classes.push('before:absolute');
        classes.push('before:w-3/12');
        classes.push('before:h-3/12');
        classes.push('before:rounded-full');
        classes.push('before:bg-solana/70');
      }
    }

    return (
      <div
        key={`${square.row}-${square.col}`}
        className={classes.join(' ')}
        onClick={() => handleSquareClick(square)}
      >
        {square.piece && <ChessPieceComponent piece={square.piece} />}
      </div>
    );
  };

  const renderBoard = () => {
    const isSelected = (square: ChessSquare) =>
      board.selectedSquare?.row === square.row && board.selectedSquare?.col === square.col;

    const isValidMove = (square: ChessSquare) =>
      board.validMoves.some((move) => move.row === square.row && move.col === square.col);

    let squares = board.squares.map((row, rowIndex) =>
      row.map((square, colIndex) => renderSquare(square, isSelected(square), isValidMove(square)))
    );

    // Flatten the 2D array
    let flattenedSquares = squares.flat();

    // If the board is flipped, reverse the order
    if (flipped) {
      flattenedSquares = flattenedSquares.reverse();
    }

    return flattenedSquares;
  };

  const toggleBoardOrientation = () => {
    setFlipped(!flipped);
  };

  // Add file (a-h) and rank (1-8) labels
  const renderBoardWithLabels = () => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    if (flipped) {
      files.reverse();
      ranks.reverse();
    }

    return (
      <div className="relative">
        {/* File labels (bottom) */}
        <div className="absolute -bottom-6 left-0 right-0 flex justify-around px-2">
          {files.map(file => (
            <div key={file} className="text-xs text-muted-foreground w-6 text-center">
              {file}
            </div>
          ))}
        </div>
        
        {/* Rank labels (left side) */}
        <div className="absolute -left-6 top-0 bottom-0 flex flex-col justify-around py-1">
          {ranks.map(rank => (
            <div key={rank} className="text-xs text-muted-foreground h-6 flex items-center">
              {rank}
            </div>
          ))}
        </div>
        
        {/* The actual chess board */}
        <div className={`chess-board rounded-lg overflow-hidden shadow-xl border-2 border-solana/50`} style={{ width: boardSize, height: boardSize }}>
          {renderBoard()}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative pb-8 pl-8">
        {renderBoardWithLabels()}
      </div>
      
      <button
        onClick={toggleBoardOrientation}
        className="mt-4 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-sm transition-colors duration-200"
      >
        Flip Board
      </button>
    </div>
  );
};

export default ChessBoard;
