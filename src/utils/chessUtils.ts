
import { ChessBoard, ChessPiece, ChessSquare, PieceColor, PieceType } from './chessTypes';

export const createInitialBoard = (): ChessBoard => {
  const squares: ChessSquare[][] = Array(8)
    .fill(null)
    .map((_, row) =>
      Array(8)
        .fill(null)
        .map((_, col) => ({
          row,
          col,
          piece: null,
        }))
    );

  // Set up pawns
  for (let col = 0; col < 8; col++) {
    squares[1][col].piece = { type: 'pawn', color: 'black', id: `bp${col}` };
    squares[6][col].piece = { type: 'pawn', color: 'white', id: `wp${col}` };
  }

  // Set up other pieces
  const setupRow = (row: number, color: PieceColor) => {
    const pieces: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    pieces.forEach((type, col) => {
      squares[row][col].piece = { type, color, id: `${color[0]}${type[0]}${col}` };
    });
  };

  setupRow(0, 'black');
  setupRow(7, 'white');

  return {
    squares,
    currentTurn: 'white',
    selectedSquare: null,
    validMoves: [],
    capturedPieces: [],
    moveHistory: [],
    whiteTime: 0,
    blackTime: 0,
    isTimerRunning: false,
    gameOver: false,
    winner: null,
  };
};

export const getValidMoves = (board: ChessBoard, square: ChessSquare): ChessSquare[] => {
  if (!square.piece) return [];

  const validMoves: ChessSquare[] = [];
  const { row, col, piece } = square;
  const { type, color } = piece;

  // This is a simplified version that doesn't include all chess rules
  // In a real implementation, we'd need to handle checks, castling, en passant, etc.

  switch (type) {
    case 'pawn':
      handlePawnMoves(board, row, col, color, validMoves);
      break;
    case 'knight':
      handleKnightMoves(board, row, col, color, validMoves);
      break;
    case 'bishop':
      handleBishopMoves(board, row, col, color, validMoves);
      break;
    case 'rook':
      handleRookMoves(board, row, col, color, validMoves);
      break;
    case 'queen':
      handleBishopMoves(board, row, col, color, validMoves);
      handleRookMoves(board, row, col, color, validMoves);
      break;
    case 'king':
      handleKingMoves(board, row, col, color, validMoves);
      break;
  }

  return validMoves;
};

const handlePawnMoves = (
  board: ChessBoard,
  row: number,
  col: number,
  color: PieceColor,
  validMoves: ChessSquare[]
) => {
  const direction = color === 'white' ? -1 : 1;
  const startRow = color === 'white' ? 6 : 1;

  // Move forward one square
  if (isInBounds(row + direction, col) && !board.squares[row + direction][col].piece) {
    validMoves.push(board.squares[row + direction][col]);

    // Move forward two squares from starting position
    if (row === startRow && !board.squares[row + 2 * direction][col].piece) {
      validMoves.push(board.squares[row + 2 * direction][col]);
    }
  }

  // Capture diagonally
  const captureMoves = [
    { r: row + direction, c: col - 1 },
    { r: row + direction, c: col + 1 },
  ];

  captureMoves.forEach(({ r, c }) => {
    if (isInBounds(r, c) && board.squares[r][c].piece && board.squares[r][c].piece!.color !== color) {
      validMoves.push(board.squares[r][c]);
    }
  });
};

const handleKnightMoves = (
  board: ChessBoard,
  row: number,
  col: number,
  color: PieceColor,
  validMoves: ChessSquare[]
) => {
  const moves = [
    { r: row - 2, c: col - 1 },
    { r: row - 2, c: col + 1 },
    { r: row - 1, c: col - 2 },
    { r: row - 1, c: col + 2 },
    { r: row + 1, c: col - 2 },
    { r: row + 1, c: col + 2 },
    { r: row + 2, c: col - 1 },
    { r: row + 2, c: col + 1 },
  ];

  moves.forEach(({ r, c }) => {
    if (isInBounds(r, c) && (!board.squares[r][c].piece || board.squares[r][c].piece!.color !== color)) {
      validMoves.push(board.squares[r][c]);
    }
  });
};

const handleBishopMoves = (
  board: ChessBoard,
  row: number,
  col: number,
  color: PieceColor,
  validMoves: ChessSquare[]
) => {
  const directions = [
    { dr: -1, dc: -1 },
    { dr: -1, dc: 1 },
    { dr: 1, dc: -1 },
    { dr: 1, dc: 1 },
  ];

  directions.forEach(({ dr, dc }) => {
    let r = row + dr;
    let c = col + dc;

    while (isInBounds(r, c)) {
      if (!board.squares[r][c].piece) {
        validMoves.push(board.squares[r][c]);
      } else {
        if (board.squares[r][c].piece!.color !== color) {
          validMoves.push(board.squares[r][c]);
        }
        break;
      }
      r += dr;
      c += dc;
    }
  });
};

const handleRookMoves = (
  board: ChessBoard,
  row: number,
  col: number,
  color: PieceColor,
  validMoves: ChessSquare[]
) => {
  const directions = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];

  directions.forEach(({ dr, dc }) => {
    let r = row + dr;
    let c = col + dc;

    while (isInBounds(r, c)) {
      if (!board.squares[r][c].piece) {
        validMoves.push(board.squares[r][c]);
      } else {
        if (board.squares[r][c].piece!.color !== color) {
          validMoves.push(board.squares[r][c]);
        }
        break;
      }
      r += dr;
      c += dc;
    }
  });
};

const handleKingMoves = (
  board: ChessBoard,
  row: number,
  col: number,
  color: PieceColor,
  validMoves: ChessSquare[]
) => {
  const moves = [
    { r: row - 1, c: col - 1 },
    { r: row - 1, c: col },
    { r: row - 1, c: col + 1 },
    { r: row, c: col - 1 },
    { r: row, c: col + 1 },
    { r: row + 1, c: col - 1 },
    { r: row + 1, c: col },
    { r: row + 1, c: col + 1 },
  ];

  moves.forEach(({ r, c }) => {
    if (isInBounds(r, c) && (!board.squares[r][c].piece || board.squares[r][c].piece!.color !== color)) {
      validMoves.push(board.squares[r][c]);
    }
  });
};

const isInBounds = (row: number, col: number): boolean => {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
};

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

export const timeControlOptions = [
  { type: 'blitz', startTime: 3 * 60, increment: 2, label: 'Blitz - 3+2' },
  { type: 'rapid', startTime: 10 * 60, increment: 5, label: 'Rapid - 10+5' },
  { type: 'classical', startTime: 30 * 60, increment: 30, label: 'Classical - 30+30' },
  { type: 'custom', startTime: 5 * 60, increment: 3, label: 'Custom' },
];
