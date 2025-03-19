
import React, { useState } from 'react';
import { useWallet } from '../integrations/solana/wallet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { timeControlOptions } from '../utils/chessUtils';
import { TimeControl } from '../utils/chessTypes';
import { useToast } from "@/hooks/use-toast";

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
  
  const MAX_STAKE = 100; // Maximum stake amount in SOL

  const handleCreateGame = () => {
    // Check if wallet has enough balance
    if (wallet && stakeAmount > 0) {
      if (wallet.balance < stakeAmount) {
        toast({
          title: "Insufficient Balance",
          description: `You need at least ${stakeAmount} SOL in your wallet to stake this game.`,
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

  // Format time for display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
              <Slider
                value={[stakeAmount]}
                min={0}
                max={MAX_STAKE}
                step={0.1}
                onValueChange={(value) => setStakeAmount(value[0])}
                className="mb-6"
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">0 SOL</span>
                <div className="px-3 py-1 bg-card rounded border border-border">
                  <span className="font-medium">{stakeAmount.toFixed(1)} SOL</span>
                </div>
                <span className="text-sm text-muted-foreground">{MAX_STAKE} SOL</span>
              </div>
              
              {wallet && (
                <div className="text-sm mt-2 text-right">
                  Your balance: <span className="font-medium">{wallet.balance.toFixed(2)} SOL</span>
                </div>
              )}
              
              {wallet && stakeAmount > wallet.balance && (
                <div className="text-sm text-red-500 mt-1">
                  Insufficient balance for this stake amount
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreateGame}>
            Create Game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewGameModal;
