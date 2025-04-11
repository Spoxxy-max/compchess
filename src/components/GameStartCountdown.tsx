
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import CountdownTimer from './CountdownTimer';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Users, Clock } from 'lucide-react';
import { getGameById, GameData, subscribeToGame, supabase } from '../utils/supabaseClient';
import { Button } from '@/components/ui/button';

interface GameStartCountdownProps {
  gameId: string;
  playerColor: 'white' | 'black';
  onCountdownComplete: () => void;
  opponentName?: string;
  stake?: number;
}

const GameStartCountdown: React.FC<GameStartCountdownProps> = ({
  gameId,
  playerColor,
  onCountdownComplete,
  opponentName = "Opponent",
  stake = 0
}) => {
  const [status, setStatus] = useState<'waiting' | 'ready' | 'counting'>('waiting');
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Fetch game data and subscribe to real-time updates
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const data = await getGameById(gameId);
        if (data) {
          setGameData(data);
          
          // Check if both players are already connected
          const isWhitePlayer = data.host_id && playerColor === 'white';
          const isBlackPlayer = data.opponent_id && playerColor === 'black';
          
          // If we're the white player (host) and opponent has joined, or
          // if we're the black player (opponent) and we've successfully joined
          if ((isWhitePlayer && data.opponent_id) || (isBlackPlayer && data.host_id)) {
            setStatus('ready');
            toast({
              title: "Game Ready",
              description: "Both players are now connected. Game starting soon!",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching game data:", error);
      }
    };
    
    fetchGameData();
    
    // Subscribe to real-time updates
    const subscription = subscribeToGame(gameId, async (payload) => {
      console.log("Game update received:", payload);
      
      // Fetch the latest game data to ensure we have all changes
      const updatedGame = await getGameById(gameId);
      
      if (updatedGame) {
        setGameData(updatedGame);
        
        // Check if both players are connected
        if (updatedGame.host_id && updatedGame.opponent_id && status === 'waiting') {
          setStatus('ready');
          toast({
            title: "Opponent Connected",
            description: "Both players are now ready. Game starting soon!",
          });

          // Start countdown after a short delay
          setTimeout(() => {
            setStatus('counting');
          }, 1500);
        }
      }
    });
    
    // Start a timer to track how long we've been waiting
    const waitingTimer = setInterval(() => {
      setElapsedTime(prev => {
        // If we've been waiting more than 2 minutes, mark as expired
        if (prev >= 120 && status === 'waiting') {
          setIsExpired(true);
          clearInterval(waitingTimer);
        }
        return prev + 1;
      });
    }, 1000);
    
    return () => {
      // Clean up subscription and timer
      if (subscription) {
        subscription.unsubscribe();
      }
      clearInterval(waitingTimer);
    };
  }, [gameId, playerColor, toast, status]);
  
  // Start countdown once both players are ready
  useEffect(() => {
    if (status === 'ready') {
      // Slight delay before starting countdown for better UX
      const timer = setTimeout(() => {
        setStatus('counting');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Format the opponent name for display
  const formatPlayerName = (address?: string) => {
    if (!address) return "Waiting for opponent...";
    
    // Truncate wallet address for display
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Status message based on current state
  const getStatusMessage = () => {
    if (status === 'waiting') {
      if (playerColor === 'white') {
        return "Waiting for an opponent to join...";
      } else {
        return "Connecting to game...";
      }
    } else if (status === 'ready') {
      return "Opponent connected! Preparing game...";
    } else {
      return "Game starting in:";
    }
  };
  
  // Helper function to copy the game code
  const copyGameCode = () => {
    if (gameData?.game_code) {
      navigator.clipboard.writeText(gameData.game_code);
      setCopied(true);
      toast({
        title: "Code Copied",
        description: "Game code copied to clipboard"
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="p-6 max-w-md w-full bg-card/90 backdrop-blur shadow-xl border border-solana/20">
      <div className="text-center space-y-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-1">Game Starting Soon</h2>
          <p className="text-gray-400">
            You are playing as <span className="font-medium text-white">{playerColor}</span>
            {stake > 0 && <span> with <span className="text-solana font-medium">{stake} SOL</span> stake</span>}
          </p>
        </div>
        
        <div className="py-2">
          <p className="text-sm text-gray-300 mb-4">{getStatusMessage()}</p>
          
          {status === 'waiting' && playerColor === 'white' && gameData?.game_code && (
            <div className="bg-black/20 rounded-md p-4 mb-4 border border-solana/20">
              <p className="text-sm mb-2">Share this game code with your opponent:</p>
              <div className="flex items-center justify-center gap-2">
                <div className="font-mono text-2xl tracking-widest text-solana font-semibold">
                  {gameData.game_code}
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-full" 
                  onClick={copyGameCode}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
          
          {status === 'waiting' && (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="h-10 w-10 animate-spin text-solana mb-4" />
              
              {playerColor === 'black' && (
                <p>Waiting for the host to connect...</p>
              )}
              
              {isExpired && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md text-yellow-200 text-sm">
                  It's taking longer than usual. The other player may have left.
                </div>
              )}
              
              {elapsedTime > 30 && elapsedTime < 120 && (
                <p className="mt-4 text-sm text-gray-400">
                  Waiting for {elapsedTime} seconds...
                </p>
              )}
            </div>
          )}
          
          {status === 'counting' && (
            <div className="py-6">
              <CountdownTimer 
                seconds={5} 
                onComplete={onCountdownComplete}
                size="large"
              />
            </div>
          )}
        </div>
        
        <div className="pt-4 border-t border-gray-700/30">
          <div className="flex justify-between items-center">
            <div className="text-left">
              <p className="text-sm text-gray-400 flex items-center gap-1">
                <Users className="h-4 w-4" /> You
              </p>
              <p className="font-medium">
                {playerColor === 'white' 
                  ? formatPlayerName(gameData?.host_id) 
                  : formatPlayerName(gameData?.opponent_id)}
              </p>
            </div>
            <div className="mx-2 my-2 px-3 py-1.5 bg-gray-800/50 rounded-full flex items-center">
              <Clock className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
              <span className="text-xs text-gray-300">
                {gameData?.time_control ? gameData.time_control.replace('-', ' ').toUpperCase() : 'Standard'}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 flex items-center justify-end gap-1">
                Opponent <Users className="h-4 w-4" />
              </p>
              <p className="font-medium">
                {playerColor === 'white' 
                  ? formatPlayerName(gameData?.opponent_id) 
                  : formatPlayerName(gameData?.host_id)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GameStartCountdown;
