
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { TimeControl } from '../utils/chessTypes';
import { formatTime, timeControlOptions } from '../utils/chessUtils';
import { Timer, User, Loader2, SlidersHorizontal, CoinsIcon } from 'lucide-react';
import { getAvailableGames, GameData, joinGame } from '../utils/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { useWallet } from '@solana/wallet-adapter-react';
import JoinStakeConfirmationModal from './JoinStakeConfirmationModal';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

interface JoinGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinGame: (gameId: string, stake: number, timeControl: TimeControl) => void;
}

const JoinGameModal: React.FC<JoinGameModalProps> = ({ isOpen, onClose, onJoinGame }) => {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [availableGames, setAvailableGames] = useState<GameData[]>([]);
  const [filteredGames, setFilteredGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStakeConfirmationOpen, setIsStakeConfirmationOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl | null>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  
  // Filter states
  const [maxStake, setMaxStake] = useState<number>(10);
  const [stakeRange, setStakeRange] = useState<[number, number]>([0, 10]);
  const [timeControlFilter, setTimeControlFilter] = useState<string[]>([]);
  
  const { toast } = useToast();
  const { publicKey } = useWallet();

  useEffect(() => {
    if (isOpen) {
      fetchAvailableGames();
    }
  }, [isOpen]);

  // Apply filters to available games
  useEffect(() => {
    if (availableGames.length > 0) {
      let filtered = [...availableGames];
      
      // Apply stake filter
      filtered = filtered.filter(game => 
        game.stake >= stakeRange[0] && game.stake <= stakeRange[1]
      );
      
      // Apply time control filter if any are selected
      if (timeControlFilter.length > 0) {
        filtered = filtered.filter(game => 
          timeControlFilter.includes(game.time_control)
        );
      }
      
      setFilteredGames(filtered);
    }
  }, [availableGames, stakeRange, timeControlFilter]);

  // Calculate max stake for slider
  useEffect(() => {
    if (availableGames.length > 0) {
      const maxGameStake = Math.max(...availableGames.map(game => game.stake));
      setMaxStake(Math.max(maxGameStake, 0.1));
      // Initialize stake range to include all games
      setStakeRange([0, maxGameStake]);
    }
  }, [availableGames]);

  const fetchAvailableGames = async () => {
    setLoading(true);
    try {
      // Exclude user's own games when fetching by passing the wallet public key
      const games = await getAvailableGames(publicKey?.toString());
      console.log("Available games fetched:", games);
      setAvailableGames(games);
      setFilteredGames(games);
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

  const handleJoinGameClick = () => {
    if (selectedGameId) {
      const game = availableGames.find(game => game.id === selectedGameId);
      if (game) {
        console.log("Selected game for joining:", game);
        
        // Find the matching time control option or create a custom one
        const timeControlOption = timeControlOptions.find(
          option => option.type === game.time_control
        ) || {
          type: 'custom',
          startTime: game.time_white,
          increment: 0, // We don't have this info directly
          label: `Custom - ${Math.floor(game.time_white / 60)}:${String(game.time_white % 60).padStart(2, '0')}`
        };
        
        console.log("Time control for game:", timeControlOption);
        console.log("Stake amount for game:", game.stake);
        
        setSelectedGame(game);
        setSelectedTimeControl(timeControlOption);
        setIsStakeConfirmationOpen(true);
      }
    }
  };

  const handleConfirmStake = async (gameId: string) => {
    if (!publicKey || !selectedGame || !selectedTimeControl) {
      console.error("Missing required data to join game:", {
        hasPublicKey: !!publicKey,
        hasSelectedGame: !!selectedGame,
        hasTimeControl: !!selectedTimeControl
      });
      return;
    }
    
    try {
      console.log("Confirming stake to join game:", gameId);
      
      // Join the game in Supabase
      const joined = await joinGame(gameId, publicKey.toString());
      
      if (joined) {
        console.log("Successfully joined game in database");
        onJoinGame(gameId, selectedGame.stake, selectedTimeControl);
        setIsStakeConfirmationOpen(false);
        onClose();
      } else {
        toast({
          title: "Error",
          description: "Failed to join the game",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error joining game:", error);
      toast({
        title: "Error",
        description: "Failed to join the game",
        variant: "destructive",
      });
    }
  };

  const handleRefreshGames = () => {
    fetchAvailableGames();
  };

  const handleTimeControlFilterToggle = (timeControlType: string) => {
    if (timeControlFilter.includes(timeControlType)) {
      setTimeControlFilter(timeControlFilter.filter(t => t !== timeControlType));
    } else {
      setTimeControlFilter([...timeControlFilter, timeControlType]);
    }
  };

  // Format time control label for display
  const getTimeControlLabel = (game: GameData): string => {
    const timeInMinutes = Math.floor(game.time_white / 60);
    const timeInSeconds = game.time_white % 60;
    
    // Find matching predefined time control
    const timeControlOption = timeControlOptions.find(
      option => option.type === game.time_control
    );
    
    if (timeControlOption) {
      return timeControlOption.label;
    }
    
    // Format custom time control
    return `${timeInMinutes}:${String(timeInSeconds).padStart(2, '0')}`;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-card sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Join Game</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium">Available Games</h3>
              <div className="flex space-x-2">
                <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <SlidersHorizontal className="h-4 w-4" />
                      <span>Filter</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filter Games</SheetTitle>
                    </SheetHeader>
                    <div className="py-4 space-y-6">
                      <div className="space-y-4">
                        <Label className="text-sm font-medium">Stake Amount (SOL)</Label>
                        <div className="flex justify-between text-sm">
                          <span>{stakeRange[0]} SOL</span>
                          <span>{stakeRange[1]} SOL</span>
                        </div>
                        <Slider 
                          defaultValue={[0, maxStake]} 
                          value={stakeRange}
                          max={maxStake} 
                          step={0.01} 
                          onValueChange={(value) => setStakeRange([value[0], value[1]])} 
                          className="my-2"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Time Control</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {timeControlOptions.map(option => (
                            <Button 
                              key={option.type}
                              variant={timeControlFilter.includes(option.type) ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleTimeControlFilterToggle(option.type)}
                              className="justify-center text-sm"
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end mt-4 space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setStakeRange([0, maxStake]);
                          setTimeControlFilter([]);
                        }}
                      >
                        Reset
                      </Button>
                      <Button onClick={() => setIsFilterSheetOpen(false)}>Apply</Button>
                    </div>
                  </SheetContent>
                </Sheet>
                
                <Button variant="outline" size="sm" onClick={handleRefreshGames}>
                  Refresh
                </Button>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-solana" />
                <p className="text-gray-400">Loading available games...</p>
              </div>
            ) : filteredGames.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No games available to join</p>
                <p className="text-sm mt-2">Create a new game or check back later</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {filteredGames.map((game) => {
                  const timeControlLabel = getTimeControlLabel(game);
                  
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
              className="bg-solana hover:bg-solana-dark text-white" 
              onClick={handleJoinGameClick}
              disabled={!selectedGameId}
            >
              Join Game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedGame && selectedTimeControl && (
        <JoinStakeConfirmationModal
          isOpen={isStakeConfirmationOpen}
          onClose={() => setIsStakeConfirmationOpen(false)}
          onConfirm={handleConfirmStake}
          gameId={selectedGame.id}
          stake={selectedGame.stake}
          timeControl={getTimeControlLabel(selectedGame)}
          timeControlObject={selectedTimeControl}
        />
      )}
    </>
  );
};

export default JoinGameModal;
