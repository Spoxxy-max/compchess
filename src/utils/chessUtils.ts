
import { ChessBoard, ChessPiece, ChessSquare, PieceColor, PieceType, TimeControl, TimeControlOption } from './chessTypes';

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
    squares[1][col].piece = { type: 'pawn', color: 'black', id: `bp${col}`, hasMoved: false };
    squares[6][col].piece = { type: 'pawn', color: 'white', id: `wp${col}`, hasMoved: false };
  }

  // Set up other pieces
  const setupRow = (row: number, color: PieceColor) => {
    const pieces: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    pieces.forEach((type, col) => {
      squares[row][col].piece = { type, color, id: `${color[0]}${type[0]}${col}`, hasMoved: false };
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

  // Get all possible moves based on piece type
  let possibleMoves: ChessSquare[] = [];

  switch (type) {
    case 'pawn':
      possibleMoves = getPawnMoves(board, row, col, color);
      break;
    case 'knight':
      possibleMoves = getKnightMoves(board, row, col, color);
      break;
    case 'bishop':
      possibleMoves = getBishopMoves(board, row, col, color);
      break;
    case 'rook':
      possibleMoves = getRookMoves(board, row, col, color);
      break;
    case 'queen':
      possibleMoves = [...getBishopMoves(board, row, col, color), ...getRookMoves(board, row, col, color)];
      break;
    case 'king':
      possibleMoves = getKingMoves(board, row, col, color);
      break;
  }

  // Filter out moves that would put the king in check
  for (const move of possibleMoves) {
    const simulatedBoard = simulateMove(board, square, move);
    if (!isInCheck(simulatedBoard, color)) {
      validMoves.push(move);
    }
  }

  return validMoves;
};

// Simulate a move to check if it would result in check
export const simulateMove = (board: ChessBoard, from: ChessSquare, to: ChessSquare): ChessBoard => {
  const newBoard = JSON.parse(JSON.stringify(board));
  const fromSquare = newBoard.squares[from.row][from.col];
  const toSquare = newBoard.squares[to.row][to.col];
  
  // Move the piece
  toSquare.piece = fromSquare.piece;
  fromSquare.piece = null;
  
  return newBoard;
};

// Check if a king is in check
export const isInCheck = (board: ChessBoard, color: PieceColor): boolean => {
  // Find the king
  let kingRow = -1;
  let kingCol = -1;
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board.squares[r][c].piece;
      if (piece && piece.type === 'king' && piece.color === color) {
        kingRow = r;
        kingCol = c;
        break;
      }
    }
    if (kingRow !== -1) break;
  }
  
  if (kingRow === -1) return false; // King not found
  
  // Check if any opponent's piece can attack the king
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board.squares[r][c].piece;
      if (piece && piece.color !== color) {
        // Skip checking for king's move to avoid infinite recursion
        if (piece.type === 'king') {
          const dr = Math.abs(r - kingRow);
          const dc = Math.abs(c - kingCol);
          if (dr <= 1 && dc <= 1) return true;
          continue;
        }
        
        let moves: ChessSquare[] = [];
        switch (piece.type) {
          case 'pawn':
            moves = getPawnAttacks(board, r, c, piece.color);
            break;
          case 'knight':
            moves = getKnightMoves(board, r, c, piece.color, true);
            break;
          case 'bishop':
            moves = getBishopMoves(board, r, c, piece.color, true);
            break;
          case 'rook':
            moves = getRookMoves(board, r, c, piece.color, true);
            break;
          case 'queen':
            moves = [...getBishopMoves(board, r, c, piece.color, true), ...getRookMoves(board, r, c, piece.color, true)];
            break;
        }
        
        // Check if any move can capture the king
        for (const move of moves) {
          if (move.row === kingRow && move.col === kingCol) {
            return true;
          }
        }
      }
    }
  }
  
  return false;
};

// Check if a player is in checkmate
export const isCheckmate = (board: ChessBoard, color: PieceColor): boolean => {
  // If not in check, not checkmate
  if (!isInCheck(board, color)) return false;
  
  // Check if any move can get out of check
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board.squares[r][c].piece;
      if (piece && piece.color === color) {
        const validMoves = getValidMoves(board, board.squares[r][c]);
        if (validMoves.length > 0) return false;
      }
    }
  }
  
  return true;
};

// Get all possible pawn moves
export const getPawnMoves = (board: ChessBoard, row: number, col: number, color: PieceColor, attackOnly = false): ChessSquare[] => {
  const moves: ChessSquare[] = [];
  const direction = color === 'white' ? -1 : 1;
  const startRow = color === 'white' ? 6 : 1;

  if (!attackOnly) {
    // Move forward one square
    if (isInBounds(row + direction, col) && !board.squares[row + direction][col].piece) {
      moves.push(board.squares[row + direction][col]);

      // Move forward two squares from starting position
      if (row === startRow && !board.squares[row + 2 * direction][col].piece) {
        moves.push(board.squares[row + 2 * direction][col]);
      }
    }
  }

  // Capture diagonally
  const captureMoves = getPawnAttacks(board, row, col, color);
  moves.push(...captureMoves);

  return moves;
};

// Get just the attacking squares for a pawn
export const getPawnAttacks = (board: ChessBoard, row: number, col: number, color: PieceColor): ChessSquare[] => {
  const moves: ChessSquare[] = [];
  const direction = color === 'white' ? -1 : 1;

  const captureMoves = [
    { r: row + direction, c: col - 1 },
    { r: row + direction, c: col + 1 },
  ];

  captureMoves.forEach(({ r, c }) => {
    if (isInBounds(r, c)) {
      const targetSquare = board.squares[r][c];
      if (targetSquare.piece && targetSquare.piece.color !== color) {
        moves.push(targetSquare);
      } else if (!targetSquare.piece) {
        // Potential en passant or attack path for check detection
        moves.push(targetSquare);
      }
    }
  });

  return moves;
};

export const getKnightMoves = (board: ChessBoard, row: number, col: number, color: PieceColor, attackOnly = false): ChessSquare[] => {
  const moves: ChessSquare[] = [];
  const knightMoves = [
    { r: row - 2, c: col - 1 },
    { r: row - 2, c: col + 1 },
    { r: row - 1, c: col - 2 },
    { r: row - 1, c: col + 2 },
    { r: row + 1, c: col - 2 },
    { r: row + 1, c: col + 2 },
    { r: row + 2, c: col - 1 },
    { r: row + 2, c: col + 1 },
  ];

  knightMoves.forEach(({ r, c }) => {
    if (isInBounds(r, c)) {
      const targetSquare = board.squares[r][c];
      if (attackOnly || !targetSquare.piece || targetSquare.piece.color !== color) {
        moves.push(targetSquare);
      }
    }
  });

  return moves;
};

export const getBishopMoves = (board: ChessBoard, row: number, col: number, color: PieceColor, attackOnly = false): ChessSquare[] => {
  const moves: ChessSquare[] = [];
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
      const targetSquare = board.squares[r][c];
      
      if (!targetSquare.piece) {
        moves.push(targetSquare);
      } else {
        if (targetSquare.piece.color !== color || attackOnly) {
          moves.push(targetSquare);
        }
        break;
      }
      
      r += dr;
      c += dc;
    }
  });

  return moves;
};

export const getRookMoves = (board: ChessBoard, row: number, col: number, color: PieceColor, attackOnly = false): ChessSquare[] => {
  const moves: ChessSquare[] = [];
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
      const targetSquare = board.squares[r][c];
      
      if (!targetSquare.piece) {
        moves.push(targetSquare);
      } else {
        if (targetSquare.piece.color !== color || attackOnly) {
          moves.push(targetSquare);
        }
        break;
      }
      
      r += dr;
      c += dc;
    }
  });

  return moves;
};

export const getKingMoves = (board: ChessBoard, row: number, col: number, color: PieceColor): ChessSquare[] => {
  const moves: ChessSquare[] = [];
  const kingMoves = [
    { r: row - 1, c: col - 1 },
    { r: row - 1, c: col },
    { r: row - 1, c: col + 1 },
    { r: row, c: col - 1 },
    { r: row, c: col + 1 },
    { r: row + 1, c: col - 1 },
    { r: row + 1, c: col },
    { r: row + 1, c: col + 1 },
  ];

  kingMoves.forEach(({ r, c }) => {
    if (isInBounds(r, c)) {
      const targetSquare = board.squares[r][c];
      if (!targetSquare.piece || targetSquare.piece.color !== color) {
        moves.push(targetSquare);
      }
    }
  });

  // Castling - only if king hasn't moved and is not in check
  const kingPiece = board.squares[row][col].piece;
  if (kingPiece && !kingPiece.hasMoved && !isInCheck(board, color)) {
    // Kingside castling
    const kingsideRook = board.squares[row][7].piece;
    if (kingsideRook && 
        kingsideRook.type === 'rook' && 
        kingsideRook.color === color && 
        !kingsideRook.hasMoved) {
      // Check if path is clear
      if (!board.squares[row][5].piece && !board.squares[row][6].piece) {
        // Check if path is under attack
        const simulatedBoard1 = simulateMove(board, board.squares[row][col], board.squares[row][5]);
        if (!isInCheck(simulatedBoard1, color)) {
          moves.push(board.squares[row][6]);
        }
      }
    }

    // Queenside castling
    const queensideRook = board.squares[row][0].piece;
    if (queensideRook && 
        queensideRook.type === 'rook' && 
        queensideRook.color === color && 
        !queensideRook.hasMoved) {
      // Check if path is clear
      if (!board.squares[row][1].piece && 
          !board.squares[row][2].piece && 
          !board.squares[row][3].piece) {
        // Check if path is under attack
        const simulatedBoard2 = simulateMove(board, board.squares[row][col], board.squares[row][3]);
        if (!isInCheck(simulatedBoard2, color)) {
          moves.push(board.squares[row][2]);
        }
      }
    }
  }

  return moves;
};

export const isInBounds = (row: number, col: number): boolean => {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
};

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

export const timeControlOptions: TimeControl[] = [
  { type: 'blitz' as TimeControlOption, startTime: 3 * 60, increment: 0, label: 'Blitz - 3+2' },
  { type: 'rapid' as TimeControlOption, startTime: 10 * 60, increment: 5, label: 'Rapid - 10+5' },
  { type: 'classical' as TimeControlOption, startTime: 30 * 60, increment: 30, label: 'Classical - 30+30' },
  { type: 'custom' as TimeControlOption, startTime: 5 * 60, increment: 3, label: 'Custom' },
];
