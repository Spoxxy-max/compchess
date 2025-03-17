
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TimeControl, TimeControlOption } from '../utils/chessTypes';
import { timeControlOptions } from '../utils/chessUtils';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGame: (timeControl: TimeControl, stake: number) => void;
}

const NewGameModal: React.FC<NewGameModalProps> = ({ isOpen, onClose, onCreateGame }) => {
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControlOption>('blitz');
  const [customMinutes, setCustomMinutes] = useState(5);
  const [customIncrement, setCustomIncrement] = useState(3);
  const [stake, setStake] = useState(0.1);

  const handleCreateGame = () => {
    const selectedOption = timeControlOptions.find(option => option.type === selectedTimeControl);
    
    let timeControl: TimeControl;
    
    if (selectedTimeControl === 'custom') {
      timeControl = {
        type: 'custom',
        startTime: customMinutes * 60,
        increment: customIncrement,
        label: `Custom - ${customMinutes}+${customIncrement}`,
      };
    } else if (selectedOption) {
      timeControl = selectedOption;
    } else {
      // Fallback to blitz if something goes wrong
      timeControl = timeControlOptions[0];
    }
    
    onCreateGame(timeControl, stake);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card sm:max-w-[425px]">
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
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-solana hover:bg-solana-dark text-white" onClick={handleCreateGame}>
            Create Game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewGameModal;
