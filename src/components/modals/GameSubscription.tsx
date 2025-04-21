
import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GameSubscriptionProps {
  gameId: string;
  onOpponentJoined: () => void;
}

const GameSubscription: React.FC<GameSubscriptionProps> = ({ gameId, onOpponentJoined }) => {
  const { toast } = useToast();
  
  useEffect(() => {
    const subscription = supabase
      .channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chess_games',
          filter: `id=eq.${gameId}`
        },
        (payload) => {
          console.log("Game update received:", payload);
          
          if (payload.new && payload.new.opponent_id) {
            toast({
              title: "Opponent Joined",
              description: "Your opponent has joined the game! Starting soon...",
            });
            
            onOpponentJoined();
          }
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [gameId, onOpponentJoined, toast]);
  
  return null;
};

export default GameSubscription;
