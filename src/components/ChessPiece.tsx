
import React from 'react';
import { ChessPiece } from '../utils/chessTypes';

interface ChessPieceProps {
  piece: ChessPiece;
  isDraggable?: boolean;
  isSelected?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onClick?: () => void;
}

const ChessPieceComponent: React.FC<ChessPieceProps> = ({ 
  piece, 
  isDraggable = false,
  isSelected = false,
  onDragStart,
  onClick 
}) => {
  const { type, color } = piece;

  // Function to get the image source for each piece
  const getPieceImage = (): string => {
    return `/images/pieces/${color}-${type}.svg`;
  };

  return (
    <div 
      className={`chess-piece group transition-all duration-200 hover:scale-110 cursor-pointer ${
        isSelected ? 'scale-110 ring-2 ring-solana rounded-full' : ''
      }`}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onClick={onClick}
    >
      <img 
        src={getPieceImage()} 
        alt={`${color} ${type}`}
        className="w-full h-full object-contain drop-shadow-md"
        draggable={false}
        style={{
          filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.4))',
          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
        }}
      />
      {isDraggable && (
        <div className="absolute inset-0 bg-solana/0 hover:bg-solana/10 rounded-full transition-colors duration-150"></div>
      )}
    </div>
  );
};

export default ChessPieceComponent;
