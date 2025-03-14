
import React from 'react';
import { formatTime } from '../utils/chessUtils';
import { ChessPiece, PieceColor } from '../utils/chessTypes';
import { Timer, Trophy } from 'lucide-react';

interface GameInfoProps {
  whiteTime: number;
  blackTime: number;
  currentTurn: PieceColor;
  capturedPieces: ChessPiece[];
  moveHistory: string[];
  gameOver: boolean;
  winner: PieceColor | null;
  stake: number;
}

const GameInfo: React.FC<GameInfoProps> = ({
  whiteTime,
  blackTime,
  currentTurn,
  capturedPieces,
  moveHistory,
  gameOver,
  winner,
  stake,
}) => {
  const whiteCaptured = capturedPieces.filter((piece) => piece.color === 'black');
  const blackCaptured = capturedPieces.filter((piece) => piece.color === 'white');

  return (
    <div className="game-info-panel w-full">
      <div className="flex flex-col space-y-4">
        {/* Player times */}
        <div className="flex flex-col space-y-2">
          <div className={`flex justify-between items-center p-2 rounded-md ${currentTurn === 'black' ? 'bg-secondary' : ''}`}>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-black mr-2"></div>
              <span className="font-semibold">Black</span>
            </div>
            <div className="flex items-center">
              <Timer className="w-4 h-4 mr-1" />
              <span className="font-mono">{formatTime(blackTime)}</span>
            </div>
          </div>
          
          <div className={`flex justify-between items-center p-2 rounded-md ${currentTurn === 'white' ? 'bg-secondary' : ''}`}>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-white border border-gray-300 mr-2"></div>
              <span className="font-semibold">White</span>
            </div>
            <div className="flex items-center">
              <Timer className="w-4 h-4 mr-1" />
              <span className="font-mono">{formatTime(whiteTime)}</span>
            </div>
          </div>
        </div>

        {/* Stake info */}
        <div className="p-3 bg-secondary/50 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Stake:</span>
            <span className="font-semibold text-solana">{stake} SOL</span>
          </div>
        </div>

        {/* Captured pieces */}
        <div className="flex flex-col space-y-2">
          <h3 className="text-sm font-medium">Captured Pieces</h3>
          <div className="flex flex-wrap gap-1 p-2 bg-secondary/30 rounded-md min-h-[50px]">
            {whiteCaptured.map((piece, index) => (
              <div key={`white-captured-${index}`} className="w-6 h-6">
                <svg 
                  viewBox="0 0 31 31" 
                  fill="#FFFFFF"
                  stroke="#000000"
                  strokeWidth="1"
                >
                  <path d={getPieceSvgPath(piece.type)} />
                </svg>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 p-2 bg-secondary/30 rounded-md min-h-[50px]">
            {blackCaptured.map((piece, index) => (
              <div key={`black-captured-${index}`} className="w-6 h-6">
                <svg 
                  viewBox="0 0 31 31" 
                  fill="#000000"
                  stroke="#FFFFFF"
                  strokeWidth="1"
                >
                  <path d={getPieceSvgPath(piece.type)} />
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* Move history */}
        <div className="flex flex-col space-y-2">
          <h3 className="text-sm font-medium">Move History</h3>
          <div className="h-40 overflow-y-auto p-2 bg-secondary/30 rounded-md">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="w-10 py-1">No.</th>
                  <th className="w-1/2 py-1 text-left">White</th>
                  <th className="w-1/2 py-1 text-left">Black</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-700/30 last:border-0">
                    <td className="py-1 text-center">{i + 1}</td>
                    <td className="py-1">{moveHistory[i * 2] || ''}</td>
                    <td className="py-1">{moveHistory[i * 2 + 1] || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Game over message */}
        {gameOver && (
          <div className="p-3 bg-solana text-white rounded-md animate-pulse">
            <div className="flex items-center justify-center space-x-2">
              <Trophy className="w-5 h-5" />
              <span className="font-bold">
                {winner ? `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!` : 'Draw!'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get SVG path for piece
const getPieceSvgPath = (type: string): string => {
  const pieceSvgs: Record<string, string> = {
    'pawn': "M15.54,1.837c-5.942,0-5.01,4.553-5.01,4.553.487,2.784,2.303,3.226,2.303,3.226-.78.803-.78,1.691-.78,1.691-1.171-.095-2.847.547-2.847.547,1.062,1.25,2.832,1.25,2.832,1.25-1.25,3.644-4.082,7.993-4.082,7.993h13.546s-2.763-4.071-4.082-7.993c0,0,1.77,0,2.833-1.25,0,0-1.676-.642-2.847-.547,0,0,0-.888-.078-1.691,0,0,1.815-.442,2.302-3.226,0,0,.932-4.553-5.01-4.553Z",
    'rook': "M8.924,6.387l.25-4.333h13.05l.249,4.333L25.05,7.97l-.625,1.583v11.5h-17.5v-11.5L6.3,7.97Zm3.125,9.75v-5h1.25v5Zm6.25,0v-5h1.25v5Z",
    'knight': "M11.074,5.971,11.3,3.971l3.5-1,6.5,1v3.5l1.5,1.5-.75,3h-1.75l-1.25,4.5-1.25,3-3.75-.5-3.5-3-.5-2.5,2.5-1.5v-1l-1.5-1Z",
    'bishop': "M14.47,2.971v3l-1,1,1,1.5,1,3.5,1,1.5h-1.5l-1,3.5v1.5h3v1.5h-6.5v-1.5h3v-1.5l-1-3.5h-1.5l1-1.5,1-3.5,1-1.5-1-1v-3Z",
    'queen': "M6.05,21.971h19.25l-2.75-12.5,2.25-2.5-2.25-2-1.25,1.75-2-3-2.25,3-2.25-3.5-2.25,3.5-2.25-3-2,3-1.25-1.75-2.25,2,2.25,2.5Z",
    'king': "M15.674,2.471v4.5h-3v2h3v3h-3v2h3v3h-3v2h3v4h2v-4h3v-2h-3v-3h3v-2h-3v-3h3v-2h-3v-4.5Z",
  };

  return pieceSvgs[type] || '';
};

export default GameInfo;
