
import React, { useState } from 'react';
import { useWallet } from '../integrations/solana/wallet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { timeControlOptions } from '../utils/chessUtils';
import { TimeControl } from '../utils/chessTypes';
import { useToast } from "@/hooks/use-toast";
import { lamportsToSol, solToLamports } from '../integrations/solana/smartContract';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGame: (timeControl: TimeControl, stake: number) => void;
}

const NewGameModal: React.FC<NewGameModalProps> = ({ isOpen, onClose, onCreateGame }) => {
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>(timeControlOptions[0]);
  const [stakeAmount, setStakeAmount] = useState(0);
  const { wallet } = useWallet();
  const { toast } = useToast();
  
  const MIN_STAKE = 0.0001; // Minimum stake amount in SOL (0.0001 SOL = 100,000 lamports)
  const MAX_STAKE = 100; // Maximum stake amount in SOL

  const handleCreateGame = () => {
    // Check if wallet has enough balance
    if (wallet && stakeAmount > 0) {
      if (wallet.balance < stakeAmount) {
        toast({
          title: "Insufficient Balance",
          description: `You need at least ${stakeAmount.toFixed(4)} SOL in your wallet to stake this game.`,
          variant: "destructive"
        });
        return;
      }
      
      if (stakeAmount < MIN_STAKE) {
        toast({
          title: "Minimum Stake Required",
          description: `Stake amount must be at least ${MIN_STAKE} SOL`,
          variant: "destructive"
        });
        return;
      }
    }
    
    onCreateGame(selectedTimeControl, stakeAmount);
    onClose();
  };

  const handleTimeControlSelect = (timeControl: TimeControl) => {
    setSelectedTimeControl(timeControl);
  };

  const handleStakeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    
    // If value is not a number or is negative, default to 0
    if (isNaN(value) || value < 0) {
      setStakeAmount(0);
    } 
    // If value exceeds max stake, cap it
    else if (value > MAX_STAKE) {
      setStakeAmount(MAX_STAKE);
      toast({
        title: "Maximum Stake Limit",
        description: `Stake amount cannot exceed ${MAX_STAKE} SOL`,
      });
    } 
    else {
      setStakeAmount(value);
    }
  };

  // Format time for display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format small stake amounts with more precision
  const formatStakeAmount = (amount: number) => {
    if (amount === 0) return '0';
    if (amount < 0.001) return amount.toFixed(4);
    return amount.toFixed(3);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create New Game</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <h3 className="text-md font-medium mb-3">Time Control</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {timeControlOptions.map((timeControl) => (
              <div
                key={timeControl.type}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTimeControl.type === timeControl.type
                    ? 'border-solana bg-solana/10'
                    : 'border-border hover:border-solana/50'
                }`}
                onClick={() => handleTimeControlSelect(timeControl)}
              >
                <div className="font-medium">{timeControl.label}</div>
                <div className="text-sm text-muted-foreground">
                  {formatTime(timeControl.startTime)} + {timeControl.increment}s
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="text-md font-medium mb-3">Stake Amount (SOL)</h3>
            <div className="space-y-3">
              <Input
                type="number"
                value={stakeAmount === 0 ? '' : stakeAmount}
                onChange={handleStakeInput}
                min={MIN_STAKE}
                max={MAX_STAKE}
                step={0.0001}
                placeholder="Enter stake amount"
                className="w-full"
              />
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Enter amount ({MIN_STAKE}-{MAX_STAKE} SOL)</span>
                <div className="px-3 py-1 bg-card rounded border border-border">
                  <span className="font-medium">{formatStakeAmount(stakeAmount)} SOL</span>
                </div>
              </div>
              
              {wallet && (
                <div className="text-sm mt-2 text-right">
                  Your balance: <span className="font-medium">{wallet.balance.toFixed(4)} SOL</span>
                </div>
              )}
              
              {wallet && stakeAmount > wallet.balance && (
                <div className="text-sm text-red-500 mt-1">
                  Insufficient balance for this stake amount
                </div>
              )}

              {stakeAmount > 0 && stakeAmount < MIN_STAKE && (
                <div className="text-sm text-yellow-500 mt-1">
                  Minimum stake is {MIN_STAKE} SOL
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateGame}
            disabled={(stakeAmount > 0 && stakeAmount < MIN_STAKE) || (wallet && stakeAmount > wallet.balance)}
          >
            Create Game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewGameModal;
