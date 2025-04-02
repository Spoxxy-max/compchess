
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
      title={isFlipped ? "Flip board back" : "Flip board"}
    >
      <RotateCw size={14} className={isFlipped ? "rotate-180 transition-transform" : "transition-transform"} />
      <span className="text-xs">Flip</span>
    </Button>
  );
};

export default GameBoardFlip;
