
import React, { useState } from 'react';
import { ChessPiece } from '../utils/chessTypes';

interface ChessPieceProps {
  piece: ChessPiece;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const ChessPieceComponent: React.FC<ChessPieceProps> = ({ 
  piece, 
  draggable = false,
  onDragStart,
  onDragEnd
}) => {
  const { type, color } = piece;
  const [isDragging, setIsDragging] = useState(false);

  // Function to get the image source for each piece
  const getPieceImage = (): string => {
    return `/images/pieces/${color}-${type}.svg`;
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable) return;
    setIsDragging(true);
    if (onDragStart) onDragStart();
    
    // Set drag image
    const img = new Image();
    img.src = getPieceImage();
    e.dataTransfer.setDragImage(img, 30, 30);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    if (!draggable) return;
    setIsDragging(false);
    if (onDragEnd) onDragEnd();
  };

  return (
    <div 
      className={`chess-piece group transition-all duration-200 hover:scale-110 ${isDragging ? 'opacity-50' : ''}`}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
