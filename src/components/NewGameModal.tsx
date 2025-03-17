
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TimeControl, TimeControlOption } from '../utils/chessTypes';
import { timeControlOptions } from '../utils/chessUtils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (gameParams: { 
    timeControl: string; 
    timeIncrement: number; 
    stake: number;
  }) => Promise<void>;
}

const NewGameModal: React.FC<NewGameModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControlOption>('blitz');
  const [customMinutes, setCustomMinutes] = useState(5);
  const [customIncrement, setCustomIncrement] = useState(3);
  const [stake, setStake] = useState(0.1);
  const [gameCreated, setGameCreated] = useState(false);

  const handleCreateGame = () => {
    const selectedOption = timeControlOptions.find(option => option.type === selectedTimeControl);
    
    let timeControlString: string;
    let increment: number;
    
    if (selectedTimeControl === 'custom') {
      timeControlString = `Custom - ${customMinutes}+${customIncrement}`;
      increment = customIncrement;
    } else if (selectedOption) {
      timeControlString = selectedOption.label;
      increment = selectedOption.increment;
    } else {
      // Fallback to blitz if something goes wrong
      timeControlString = 'blitz';
      increment = 2;
    }
    
    onSubmit({
      timeControl: selectedTimeControl === 'custom' 
        ? `custom_${customMinutes}_${customIncrement}`
        : selectedTimeControl, 
      timeIncrement: increment,
      stake: stake
    });
  };

  const handleClose = () => {
    setGameCreated(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card sm:max-w-[425px]">
        {!gameCreated ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Create New Game</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="time-control">Time Control</Label>
                <RadioGroup
                  value={selectedTimeControl}
                  onValueChange={(value) => setSelectedTimeControl(value as TimeControlOption)}
                  className="grid grid-cols-2 gap-2"
                >
                  {timeControlOptions.map((option) => (
                    <div key={option.type} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.type} id={option.type} />
                      <Label htmlFor={option.type} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {selectedTimeControl === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="custom-minutes">Minutes</Label>
                    <Input
                      id="custom-minutes"
                      type="number"
                      min="1"
                      max="180"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 5)}
                      className="bg-secondary"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="custom-increment">Increment (sec)</Label>
                    <Input
                      id="custom-increment"
                      type="number"
                      min="0"
                      max="60"
                      value={customIncrement}
                      onChange={(e) => setCustomIncrement(parseInt(e.target.value) || 0)}
                      className="bg-secondary"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="stake">Stake Amount (SOL)</Label>
                <Input
                  id="stake"
                  type="number"
                  min="0"
                  step="0.01"
                  value={stake}
                  onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
                  className="bg-secondary"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button className="bg-solana hover:bg-solana-dark text-white" onClick={handleCreateGame}>
                Create Game
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Game Created</DialogTitle>
            </DialogHeader>
            
            <div className="py-6">
              <Alert className="border-solana/30 bg-solana/10">
                <CheckCircle2 className="h-5 w-5 text-solana" />
                <AlertTitle className="text-solana font-medium">Success!</AlertTitle>
                <AlertDescription className="text-foreground">
                  Your game has been created successfully. Wait for an opponent to join or check the "Join Game" section to see if other opponents are available.
                </AlertDescription>
              </Alert>
              
              <div className="mt-6 text-sm text-muted-foreground">
                <p>When an opponent joins, the countdown will start for 5 minutes, then the game will begin.</p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewGameModal;
