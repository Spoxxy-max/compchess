
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";

interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  winner: string;
  stake: number;
}

const VictoryModal: React.FC<VictoryModalProps> = ({ isOpen, onClose, winner, stake }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Victory!
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 flex flex-col items-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-solana/20 flex items-center justify-center">
            <Trophy className="h-10 w-10 text-solana animate-pulse" />
          </div>
          
          <h3 className="text-xl font-semibold text-center">
            {winner === 'you' ? 'Congratulations!' : `${winner} won!`}
          </h3>
          
          <p className="text-center text-gray-300">
            {winner === 'you' 
              ? `You've won the game and earned ${stake} SOL!` 
              : `Better luck next time. You've lost ${stake} SOL.`}
          </p>
          
          {stake > 0 && winner === 'you' && (
            <div className="bg-solana/10 p-3 rounded-md flex flex-col items-center">
              <span className="text-lg font-bold text-solana">+{stake} SOL</span>
              <span className="text-xs">Added to your wallet</span>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VictoryModal;
