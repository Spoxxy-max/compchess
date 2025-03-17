import React, { useEffect, useState, useRef, useNavigate } from 'react';
import { ChessBoard as ChessBoardType, ChessSquare, PieceColor } from '../utils/chessTypes';
import { createInitialBoard, getValidMoves, isInCheck, isCheckmate } from '../utils/chessUtils';
import ChessPieceComponent from './ChessPiece';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

interface ChessBoardProps {
  playerColor?: PieceColor;
  onMove?: (from: ChessSquare, to: ChessSquare) => void;
  gameId?: string;
  readOnly?: boolean;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ 
  playerColor = 'white', 
  onMove,
  gameId,
  readOnly = false
}) => {
  const [board, setBoard] = useState<ChessBoardType>(createInitialBoard());
  const [flipped, setFlipped] = useState(playerColor === 'black');
  const [boardSize, setBoardSize] = useState('95vw');
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const boardRef = useRef<HTMLDivElement>(null);
  const [lastMove, setLastMove] = useState<{from: ChessSquare, to: ChessSquare} | null>(null);
  const [draggedPiece, setDraggedPiece] = useState<{square: ChessSquare, x: number, y: number} | null>(null);
  const navigate = useNavigate();

  // Audio effects
  const moveAudio = useRef<HTMLAudioElement | null>(null);
  const captureAudio = useRef<HTMLAudioElement | null>(null);
  const checkAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio elements
    moveAudio.current = new Audio('/sounds/move.mp3');
    captureAudio.current = new Audio('/sounds/capture.mp3');
    checkAudio.current = new Audio('/sounds/check.mp3');
  }, []);

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
    if (board.gameOver || readOnly) return;
    
    // If it's not the player's turn in a multiplayer game, do nothing
    if (gameId && board.currentTurn !== playerColor) return;

    // If a piece is already selected
    if (board.selectedSquare) {
      // Check if the clicked square is a valid move
      const isValidMove = board.validMoves.some(
        (move) => move.row === square.row && move.col === square.col
      );

      if (isValidMove) {
        // Move the piece and handle the game logic
        movePiece(board.selectedSquare, square);
      } else if (square.piece && square.piece.color === board.currentTurn) {
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
    } else if (square.piece && square.piece.color === board.currentTurn) {
      // Select piece
      const validMoves = getValidMoves(board, square);
      setBoard({
        ...board,
        selectedSquare: square,
        validMoves,
      });
    }
  };

  const movePiece = (from: ChessSquare, to: ChessSquare) => {
    const newBoard = { ...board };
    const isCapture = !!to.piece;

    // Store the move for highlighting
    setLastMove({ from, to });
    
    // Capture piece if any
    if (isCapture) {
      newBoard.capturedPieces.push({ ...to.piece! });
    }

    // Mark piece as moved (for castling, en passant)
    if (from.piece) {
      from.piece.hasMoved = true;
    }

    // Special move: Castling
    if (from.piece?.type === 'king' && Math.abs(from.col - to.col) === 2) {
      // King-side castling
      if (to.col === 6) {
        const rook = newBoard.squares[from.row][7].piece;
        newBoard.squares[from.row][5].piece = rook;
        newBoard.squares[from.row][7].piece = null;
      }
      // Queen-side castling
      else if (to.col === 2) {
        const rook = newBoard.squares[from.row][0].piece;
        newBoard.squares[from.row][3].piece = rook;
        newBoard.squares[from.row][0].piece = null;
      }
    }

    // Special move: Pawn promotion
    const isPawnPromotion = from.piece?.type === 'pawn' && 
      ((from.piece.color === 'white' && to.row === 0) || 
       (from.piece.color === 'black' && to.row === 7));

    if (isPawnPromotion) {
      // Promote to queen automatically for now
      from.piece.type = 'queen';
    }
    
    // Move piece
    to.piece = from.piece;
    from.piece = null;

    // Update board state
    newBoard.currentTurn = board.currentTurn === 'white' ? 'black' : 'white';
    newBoard.selectedSquare = null;
    newBoard.validMoves = [];

    // Record move in algebraic notation
    const files = 'abcdefgh';
    const pieceSymbol = to.piece ? getPieceSymbol(to.piece.type) : '';
    const captureSymbol = isCapture ? 'x' : '';
    const moveNotation = `${pieceSymbol}${files[from.col]}${8 - from.row}${captureSymbol}${files[to.col]}${8 - to.row}`;
    newBoard.moveHistory.push(moveNotation);

    // Check for check and checkmate
    const opponentColor = newBoard.currentTurn;
    const isInCheckNow = isInCheck(newBoard, opponentColor);
    const isCheckmateNow = isInCheckNow && isCheckmate(newBoard, opponentColor);
    
    // Play sound
    if (isCapture && captureAudio.current) {
      captureAudio.current.play();
    } else if (isInCheckNow && checkAudio.current) {
      checkAudio.current.play();
    } else if (moveAudio.current) {
      moveAudio.current.play();
    }

    // Update game status
    if (isCheckmateNow) {
      newBoard.gameOver = true;
      newBoard.winner = newBoard.currentTurn === 'white' ? 'black' : 'white';
      toast({
        title: "Checkmate!",
        description: `${newBoard.winner} wins the game!`,
      });
    } else if (isInCheckNow) {
      toast({
        description: `${opponentColor} is in check!`,
      });
    }

    setBoard(newBoard);

    // Notify parent component
    if (onMove) {
      onMove(from, to);
    }
  };

  // Helper function to get piece symbol for notation
  const getPieceSymbol = (pieceType: string): string => {
    switch (pieceType) {
      case 'knight': return 'N';
      case 'bishop': return 'B';
      case 'rook': return 'R';
      case 'queen': return 'Q';
      case 'king': return 'K';
      default: return '';
    }
  };

  const renderSquare = (square: ChessSquare, isSelected: boolean, isValidMove: boolean) => {
    const isLight = (square.row + square.col) % 2 === 0;
    const isPartOfLastMove = lastMove && 
      ((lastMove.from.row === square.row && lastMove.from.col === square.col) ||
       (lastMove.to.row === square.row && lastMove.to.col === square.col));
    
    const classes = [
      'chess-square',
      isLight ? 'chess-square-light' : 'chess-square-dark',
      'relative',
      'flex',
      'items-center',
      'justify-center',
      'w-full',
      'h-full',
      'transition-all',
      'duration-200',
    ];

    if (isSelected) {
      classes.push('ring-2 ring-solana ring-inset shadow-inner shadow-solana/30');
    }

    if (isPartOfLastMove) {
      classes.push('bg-solana/20');
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
        <div 
          ref={boardRef}
          className="chess-board rounded-lg overflow-hidden shadow-xl border-2 border-solana/50"
          style={{ 
            width: boardSize, 
            height: boardSize,
            backgroundImage: 'url(/images/chess-board-wood.jpg)',
            backgroundSize: 'cover',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
          }}
        >
          {renderBoard()}
        </div>
      </div>
    );
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative pb-8 pl-8">
        {renderBoardWithLabels()}
      </div>
      
      <div className="flex gap-4 mt-4">
        <button
          onClick={toggleBoardOrientation}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-sm transition-colors duration-200 active:scale-95"
        >
          Flip Board
        </button>
        
        <button
          onClick={handleBackToHome}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md text-sm transition-colors duration-200 active:scale-95"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default ChessBoard;
