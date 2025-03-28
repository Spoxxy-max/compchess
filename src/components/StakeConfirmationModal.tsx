
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight } from "lucide-react";

interface StakeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  stake: number;
  timeControl: string;
}

const StakeConfirmationModal: React.FC<StakeConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  stake, 
  timeControl 
}) => {
  // Format stake amount with more precision for small amounts
  const formatStakeAmount = (amount: number) => {
    if (amount < 0.001) {
      return amount.toFixed(6);
    }
    if (amount < 0.01) {
      return amount.toFixed(5);
    }
    if (amount < 0.1) {
      return amount.toFixed(4);
    }
    return amount.toFixed(3);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Confirm Stake</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 flex flex-col space-y-4">
          <div className="flex items-center space-x-2 text-yellow-500">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">
              You're about to start a game with real stakes
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 bg-card/50 p-4 rounded-md">
            <div className="flex flex-col">
              <span className="text-sm text-gray-400">Time Control</span>
              <span className="font-medium">{timeControl}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-400">Stake Amount</span>
              <span className="font-medium text-solana">{formatStakeAmount(stake)} SOL</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-300">
            By confirming, you agree to stake {formatStakeAmount(stake)} SOL on this game. This amount will be held in escrow until the game concludes.
          </p>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            className="bg-solana hover:bg-solana-dark text-white"
          >
            Confirm Stake <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StakeConfirmationModal;
