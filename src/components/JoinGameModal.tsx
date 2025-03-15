
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { TimeControl } from '../utils/chessTypes';
import { formatTime, timeControlOptions } from '../utils/chessUtils';
import { Timer, User, Loader2 } from 'lucide-react';
import { getAvailableGames, GameData } from '../utils/supabaseClient';
import { useToast } from "@/hooks/use-toast";

interface JoinGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinGame: (gameId: string, stake: number, timeControl: TimeControl) => void;
}

const JoinGameModal: React.FC<JoinGameModalProps> = ({ isOpen, onClose, onJoinGame }) => {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [availableGames, setAvailableGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchAvailableGames();
    }
  }, [isOpen]);

  const fetchAvailableGames = async () => {
    setLoading(true);
    try {
      const games = await getAvailableGames();
      setAvailableGames(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      toast({
        title: "Error",
        description: "Failed to load available games",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = () => {
    if (selectedGameId) {
      const selectedGame = availableGames.find(game => game.id === selectedGameId);
      if (selectedGame) {
        // Find the matching time control option or create a custom one
        const timeControlOption = timeControlOptions.find(
          option => option.type === selectedGame.time_control
        ) || {
          type: 'custom',
          startTime: selectedGame.time_white,
          increment: 0, // We don't have this info directly
          label: `Custom - ${Math.floor(selectedGame.time_white / 60)}:${selectedGame.time_white % 60}`
        };
        
        onJoinGame(selectedGameId, selectedGame.stake, timeControlOption);
        onClose();
      }
    }
  };

  const handleRefreshGames = () => {
    fetchAvailableGames();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Join Game</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium">Available Games</h3>
            <Button variant="outline" size="sm" onClick={handleRefreshGames}>
              Refresh
            </Button>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-solana" />
              <p className="text-gray-400">Loading available games...</p>
            </div>
          ) : availableGames.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No games available to join</p>
              <p className="text-sm mt-2">Create a new game or check back later</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {availableGames.map((game) => {
                // Calculate time control label
                const timeInMinutes = Math.floor(game.time_white / 60);
                const timeControlLabel = timeControlOptions.find(
                  option => option.type === game.time_control
                )?.label || `${timeInMinutes} min`;
                
                return (
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
                        <span className="font-medium">{game.host_id.substring(0, 8)}...</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Timer className="w-4 h-4" />
                        <span>{formatTime(game.time_white)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-gray-400">
                        {timeControlLabel}
                      </span>
                      <span className="font-semibold text-solana">{game.stake} SOL</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            className="bg-solana hover: bg-solana-dark text-white" 
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
