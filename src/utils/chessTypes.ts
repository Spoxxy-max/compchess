
export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  id: string;
  hasMoved?: boolean;
}

export interface ChessSquare {
  row: number;
  col: number;
  piece: ChessPiece | null;
}

export interface ChessBoard {
  squares: ChessSquare[][];
  currentTurn: PieceColor;
  selectedSquare: ChessSquare | null;
  validMoves: ChessSquare[];
  capturedPieces: ChessPiece[];
  moveHistory: string[];
  whiteTime: number;
  blackTime: number;
  isTimerRunning: boolean;
  gameOver: boolean;
  winner: PieceColor | null;
}

export type TimeControlOption = 'blitz' | 'rapid' | 'classical' | 'custom';

export interface TimeControl {
  type: TimeControlOption;
  startTime: number; // Time in seconds
  increment: number; // Time in seconds
  label: string;
}

export interface GameSettings {
  timeControl: TimeControl;
  stake: number; // In SOL
}
