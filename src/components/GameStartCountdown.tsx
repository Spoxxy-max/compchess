
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import CountdownTimer from './CountdownTimer';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { getGameById, GameData, subscribeToGame, supabase } from '../utils/supabaseClient';

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
        }
      }
    });
    
    return () => {
      // Clean up subscription
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [gameId, playerColor, toast, status]);
  
  // Start countdown once both players are ready
  useEffect(() => {
    if (status === 'ready') {
      setStatus('counting');
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
          
          {status === 'waiting' && (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="h-10 w-10 animate-spin text-solana mb-4" />
              <p>Share your game link to invite an opponent</p>
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
          <div className="flex justify-between">
            <div className="text-left">
              <p className="text-sm text-gray-400">You</p>
              <p className="font-medium">
                {playerColor === 'white' 
                  ? formatPlayerName(gameData?.host_id) 
                  : formatPlayerName(gameData?.opponent_id)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Opponent</p>
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
