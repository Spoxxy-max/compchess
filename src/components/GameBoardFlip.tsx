
import React from 'react';
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";

interface GameBoardFlipProps {
  isFlipped: boolean;
  onFlip: () => void;
}

const GameBoardFlip: React.FC<GameBoardFlipProps> = ({ isFlipped, onFlip }) => {
  return (
    <Button 
      variant="outline" 
      size="sm"
      className="flex items-center gap-1 bg-card/60 hover:bg-card"
      onClick={onFlip}
      title="Flip board"
    >
      <RotateCw size={14} />
      <span className="text-xs">Flip</span>
    </Button>
  );
};

export default GameBoardFlip;
