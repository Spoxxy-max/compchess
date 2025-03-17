
import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Trophy, Clock } from 'lucide-react';

interface NewGameSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  stake: number;
}

const NewGameSuccessModal: React.FC<NewGameSuccessModalProps> = ({
  isOpen,
  onClose,
  gameId,
  stake
}) => {
  const navigate = useNavigate();

  const handleViewGames = () => {
    onClose();
    navigate('/');
  };
  
  const handleViewGame = () => {
    onClose();
    navigate(`/game/${gameId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Game Created Successfully!
          </DialogTitle>
          <DialogDescription>
            Your game has been created and is now waiting for an opponent to join.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Game ID:</span>
              <span className="text-sm text-muted-foreground">{gameId.substring(0, 8)}...</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Stake Amount:</span>
              <span className="text-sm text-muted-foreground">{stake} SOL</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Status:</span>
              <span className="text-sm flex items-center gap-1">
                <Clock className="w-3 h-3 text-yellow-500" /> 
                Waiting for Opponent
              </span>
            </div>
          </div>
          
          <p className="text-sm text-center">
            You will be notified when an opponent joins your game.
            The game will automatically start after a 5-minute countdown.
          </p>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={handleViewGames} className="flex-1 sm:flex-none">
            Back to Games
          </Button>
          <Button onClick={handleViewGame} className="flex-1 sm:flex-none">
            View Game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewGameSuccessModal;
