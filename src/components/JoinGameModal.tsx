
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { TimeControl } from '../utils/chessTypes';
import { formatTime } from '../utils/chessUtils';
import { Timer, User } from 'lucide-react';

interface GameListing {
  id: string;
  host: string;
  timeControl: TimeControl;
  stake: number;
  createdAt: Date;
}

interface JoinGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinGame: (gameId: string) => void;
  availableGames: GameListing[];
}

const JoinGameModal: React.FC<JoinGameModalProps> = ({ isOpen, onClose, onJoinGame, availableGames }) => {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  const handleJoinGame = () => {
    if (selectedGameId) {
      onJoinGame(selectedGameId);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Join Game</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Available Games</h3>
            {availableGames.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No games available to join</p>
                <p className="text-sm mt-2">Create a new game or check back later</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {availableGames.map((game) => (
                  <Card
                    key={game.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedGameId === game.id
                        ? 'border-solana bg-secondary/50'
                        : 'hover:bg-secondary/30'
                    }`}
                    onClick={() => setSelectedGameId(game.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{game.host}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Timer className="w-4 h-4" />
                        <span>{formatTime(game.timeControl.startTime)}</span>
                        <span>+{game.timeControl.increment}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-gray-400">
                        {game.timeControl.label}
                      </span>
                      <span className="font-semibold text-solana">{game.stake} SOL</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            className="bg-solana hover:bg-solana-dark text-white" 
            onClick={handleJoinGame}
            disabled={!selectedGameId}
          >
            Join Game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JoinGameModal;
