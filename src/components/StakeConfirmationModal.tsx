
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins } from 'lucide-react';

export interface StakeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stake: number;
  onConfirm: () => Promise<void>;
}

const StakeConfirmationModal: React.FC<StakeConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  stake,
  onConfirm 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            Confirm Stake
          </DialogTitle>
          <DialogDescription>
            You are about to stake {stake} SOL to join this game. This amount will be held in escrow
            until the game is complete. The winner will receive the entire stake.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">What happens to your stake:</p>
            <ul className="space-y-2 text-sm pl-5 list-disc">
              <li>If you win, you'll receive your stake back plus your opponent's stake</li>
              <li>If you lose, your opponent will receive your stake</li>
              <li>In case of a draw, both players receive their stakes back</li>
            </ul>
          </div>
          
          <p className="text-sm text-center text-muted-foreground">
            After confirming, you'll need to sign a transaction to lock your stake in the escrow account.
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={onConfirm} className="w-full sm:w-auto">
            Confirm Stake
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StakeConfirmationModal;
