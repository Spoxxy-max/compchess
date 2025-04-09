
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Clock, Search, ChevronDown, Hash } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useWallet } from '@solana/wallet-adapter-react';
import { getAllGames, getGamesCreatedByUser, GameData, getGameByCode } from '../utils/supabaseClient';
import { timeControlOptions } from '../utils/chessUtils';
import { TimeControl } from '../utils/chessTypes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface JoinGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinGame: (gameId: string, stake: number, timeControl: TimeControl) => void;
}

const JoinGameModal: React.FC<JoinGameModalProps> = ({ isOpen, onClose, onJoinGame }) => {
  const [availableGames, setAvailableGames] = useState<GameData[]>([]);
  const [filteredGames, setFilteredGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMyGames, setShowMyGames] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [isJoiningByCode, setIsJoiningByCode] = useState(false);
  const { wallet, publicKey } = useWallet();
  const { toast } = useToast();

  const fetchGames = async () => {
    setLoading(true);
    try {
      const games = await getAllGames();
      
      // Filter out games created by the current user
      const filteredGames = publicKey 
        ? games.filter(game => game.host_id !== publicKey.toString()) 
        : games;
        
      setAvailableGames(filteredGames);
      setFilteredGames(filteredGames);
    } catch (error) {
      console.error('Error fetching games:', error);
      toast({
        title: 'Error',
        description: 'Could not load available games',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGames();
      setGameCode('');
      setIsJoiningByCode(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!publicKey) return;

    const applyFilters = async () => {
      let filtered = [...availableGames];

      // Apply "My Games" filter
      if (showMyGames && publicKey) {
        const userGames = await getGamesCreatedByUser(publicKey.toString());
        filtered = userGames;
      } else if (!showMyGames && publicKey) {
        // If not showing my games, filter out games created by the current user
        filtered = filtered.filter(game => game.host_id !== publicKey.toString());
      }

      // Apply search filter
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          game => 
            game.host_id.toLowerCase().includes(term) ||
            (game.time_control && game.time_control.toLowerCase().includes(term))
        );
      }

      setFilteredGames(filtered);
    };

    applyFilters();
  }, [searchTerm, showMyGames, availableGames, publicKey]);

  const handleJoinGame = (game: GameData) => {
    // Don't allow joining your own games
    if (publicKey && game.host_id === publicKey.toString()) {
      toast({
        title: 'Cannot Join',
        description: 'You cannot join a game you created',
        variant: 'destructive',
      });
      return;
    }
    
    const timeControl = timeControlOptions.find(tc => tc.type === game.time_control) || timeControlOptions[0];
    onJoinGame(game.id, game.stake, timeControl);
  };

  const handleJoinByCode = async () => {
    if (!gameCode.trim()) {
      toast({
        title: 'Missing Game Code',
        description: 'Please enter a valid game code',
        variant: 'destructive',
      });
      return;
    }
    
    setIsJoiningByCode(true);
    
    try {
      const game = await getGameByCode(gameCode.trim());
      
      if (!game) {
        toast({
          title: 'Game Not Found',
          description: 'No game found with this code or the game is no longer available',
          variant: 'destructive',
        });
        setIsJoiningByCode(false);
        return;
      }
      
      // Check if game is created by current user
      if (publicKey && game.host_id === publicKey.toString()) {
        toast({
          title: 'Cannot Join Own Game',
          description: 'You cannot join a game you created',
          variant: 'destructive',
        });
        setIsJoiningByCode(false);
        return;
      }
      
      const timeControl = timeControlOptions.find(tc => tc.type === game.time_control) || timeControlOptions[0];
      onJoinGame(game.id, game.stake, timeControl);
      
    } catch (error) {
      console.error('Error joining game by code:', error);
      toast({
        title: 'Error',
        description: 'Failed to join the game. Please try again.',
        variant: 'destructive',
      });
      setIsJoiningByCode(false);
    }
  };

  const formatTimeControl = (timeControlStr: string) => {
    const tc = timeControlOptions.find(t => t.type === timeControlStr);
    if (!tc) return timeControlStr;
    
    const minutes = Math.floor(tc.startTime / 60);
    const seconds = tc.startTime % 60;
    const secondsStr = seconds > 0 ? `:${seconds}` : '';
    
    return `${minutes}${secondsStr} + ${tc.increment}`;
  };

  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getGameStatusLabel = (game: GameData) => {
    if (game.status === 'waiting') {
      return (
        <Badge variant="outline" className="bg-amber-900/20 text-amber-500 border-amber-500/30">
          Waiting
        </Badge>
      );
    } else if (game.status === 'active') {
      return (
        <Badge variant="outline" className="bg-green-900/20 text-green-500 border-green-500/30">
          Joined
        </Badge>
      );
    } else if (game.status === 'completed') {
      return (
        <Badge variant="outline" className="bg-blue-900/20 text-blue-500 border-blue-500/30">
          Completed
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-red-900/20 text-red-500 border-red-500/30">
          Aborted
        </Badge>
      );
    }
  };

  const isMyGame = (game: GameData) => {
    return publicKey && game.host_id === publicKey.toString();
  };

  const canJoinGame = (game: GameData) => {
    if (!publicKey) return false;
    
    // Cannot join your own game
    if (isMyGame(game)) return false;
    
    // Can only join games in waiting status
    return game.status === 'waiting';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Join a Game</DialogTitle>
          <DialogDescription>
            Enter a game code or browse available games to join
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="code" className="space-y-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="code">Join with Code</TabsTrigger>
            <TabsTrigger value="browse">Browse Games</TabsTrigger>
          </TabsList>
          
          <TabsContent value="code" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="game-code">Game Code</Label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="game-code" 
                      placeholder="Enter 6-character game code" 
                      className="pl-9 uppercase"
                      value={gameCode}
                      onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                      maxLength={6}
                    />
                  </div>
                  <Button 
                    onClick={handleJoinByCode}
                    disabled={!gameCode || gameCode.length !== 6 || isJoiningByCode}
                    className="bg-solana hover:bg-solana-dark text-white"
                  >
                    {isJoiningByCode ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      'Join Game'
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="bg-card/50 p-4 rounded-md border border-border/50">
                <h3 className="text-sm font-medium mb-2">How to Join with Code</h3>
                <p className="text-sm text-gray-300">
                  Ask your opponent for their 6-character game code. Enter it above 
                  to join their game directly without browsing through the list.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="browse">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search games..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="my-games"
                    checked={showMyGames}
                    onCheckedChange={setShowMyGames}
                  />
                  <Label htmlFor="my-games">Games Created by Me</Label>
                </div>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <div className="bg-secondary/30 px-4 py-2 flex justify-between items-center text-sm font-medium">
                  <div className="w-1/4">Host</div>
                  <div className="w-1/4 text-center">Time Control</div>
                  <div className="w-1/4 text-center">Stake</div>
                  <div className="w-1/4 text-center">Status</div>
                </div>
                
                <div className="divide-y divide-border max-h-[280px] overflow-y-auto">
                  {loading ? (
                    <div className="p-8 flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredGames.length > 0 ? (
                    filteredGames.map(game => (
                      <div key={game.id} className="px-4 py-3 flex justify-between items-center hover:bg-secondary/10 transition-colors">
                        <div className="w-1/4 truncate">
                          {formatWalletAddress(game.host_id)}
                          {isMyGame(game) && (
                            <span className="text-xs text-muted-foreground ml-1">(You)</span>
                          )}
                        </div>
                        <div className="w-1/4 text-center flex justify-center items-center">
                          <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                          {formatTimeControl(game.time_control)}
                        </div>
                        <div className="w-1/4 text-center">
                          {game.stake > 0 ? (
                            <span className="text-solana">{game.stake} SOL</span>
                          ) : (
                            <span className="text-muted-foreground">Free</span>
                          )}
                        </div>
                        <div className="w-1/4 flex justify-end items-center gap-2">
                          {getGameStatusLabel(game)}
                          {canJoinGame(game) && (
                            <Button
                              size="sm"
                              onClick={() => handleJoinGame(game)}
                              className="whitespace-nowrap bg-solana hover:bg-solana-dark text-white text-xs py-1 h-7"
                            >
                              Join
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      {showMyGames 
                        ? "You haven't created any games yet." 
                        : "No available games found. Create a new game!"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={fetchGames}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Refresh
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JoinGameModal;
