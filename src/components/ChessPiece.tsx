
import React from 'react';
import { ChessPiece } from '../utils/chessTypes';

interface ChessPieceProps {
  piece: ChessPiece;
}

const ChessPieceComponent: React.FC<ChessPieceProps> = ({ piece }) => {
  const { type, color } = piece;

  // Function to get the image source for each piece
  const getPieceImage = (): string => {
    return `/images/pieces/${color}-${type}.svg`;
  };

  return (
    <div className="chess-piece group transition-all duration-200 hover:scale-110">
      <img 
        src={getPieceImage()} 
        alt={`${color} ${type}`}
        className="w-full h-full object-contain drop-shadow-md"
        draggable={false}
        style={{
          filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.4))',
        }}
      />
    </div>
  );
};

export default ChessPieceComponent;
