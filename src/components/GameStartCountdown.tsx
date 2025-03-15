
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import CountdownTimer from './CountdownTimer';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

interface GameStartCountdownProps {
  playerColor: 'white' | 'black';
  onCountdownComplete: () => void;
  opponentName?: string;
  stake?: number;
}

const GameStartCountdown: React.FC<GameStartCountdownProps> = ({
  playerColor,
  onCountdownComplete,
  opponentName = "Opponent",
  stake = 0
}) => {
  const [status, setStatus] = useState<'waiting' | 'ready' | 'counting'>('waiting');
  const { toast } = useToast();
  
  // Simulating opponent connection
  useEffect(() => {
    // In a real implementation, this would listen to Supabase realtime events
    const timer = setTimeout(() => {
      setStatus('ready');
      toast({
        title: "Opponent Connected",
        description: "Both players are now ready. Game starting soon!",
      });
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [toast]);
  
  // Start countdown once both players are ready
  useEffect(() => {
    if (status === 'ready') {
      setStatus('counting');
    }
  }, [status]);

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
        
        {status === 'waiting' && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-10 w-10 animate-spin text-solana mb-4" />
            <p>Waiting for opponent to connect...</p>
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
        
        <div className="pt-4 border-t border-gray-700/30">
          <div className="flex justify-between">
            <div className="text-left">
              <p className="text-sm text-gray-400">You</p>
              <p className="font-medium">Player ({playerColor})</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Opponent</p>
              <p className="font-medium">{opponentName} ({playerColor === 'white' ? 'black' : 'white'})</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GameStartCountdown;
