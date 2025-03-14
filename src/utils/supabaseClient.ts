
import { createClient } from '@supabase/supabase-js';

// Supabase client initialization
// You'll need to replace these with your Supabase project URL and anon key
const supabaseUrl = 'https://ybbetihhhpoekxyzcsah.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliYmV0aWhoaHBvZWt4eXpjc2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTg3MzMsImV4cCI6MjA1NzUzNDczM30.vG0mW6v-DJecyCz-T6H8Oar49INf3yj5iJeFTwFE-Ho';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Game-related functions
export interface CreateGameParams {
  hostId: string;
  timeControl: string;
  timeIncrement: number;
  stake: number;
}

export interface GameData {
  id: string;
  host_id: string;
  opponent_id?: string;
  time_control: string;
  time_increment: number;
  stake: number;
  status: 'waiting' | 'active' | 'completed';
  winner_id?: string;
  created_at: string;
  board_state?: string;
  move_history?: string[];
}

// Create a new game in Supabase
export const createGame = async (params: CreateGameParams): Promise<GameData | null> => {
  const { hostId, timeControl, timeIncrement, stake } = params;
  
  const { data, error } = await supabase
    .from('games')
    .insert({
      host_id: hostId,
      time_control: timeControl,
      time_increment: timeIncrement,
      stake: stake,
      status: 'waiting',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating game:', error);
    return null;
  }
  
  return data;
};

// Join an existing game
export const joinGame = async (gameId: string, opponentId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('games')
    .update({ 
      opponent_id: opponentId,
      status: 'active' 
    })
    .eq('id', gameId)
    .eq('status', 'waiting');
    
  if (error) {
    console.error('Error joining game:', error);
    return false;
  }
  
  return true;
};

// Get available games
export const getAvailableGames = async (): Promise<GameData[]> => {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('status', 'waiting')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching available games:', error);
    return [];
  }
  
  return data || [];
};

// Update game state
export const updateGameState = async (
  gameId: string, 
  boardState: string, 
  moveHistory: string[]
): Promise<boolean> => {
  const { error } = await supabase
    .from('games')
    .update({ 
      board_state: boardState,
      move_history: moveHistory
    })
    .eq('id', gameId);
    
  if (error) {
    console.error('Error updating game state:', error);
    return false;
  }
  
  return true;
};

// End game and declare winner
export const endGame = async (gameId: string, winnerId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('games')
    .update({ 
      status: 'completed',
      winner_id: winnerId
    })
    .eq('id', gameId);
    
  if (error) {
    console.error('Error ending game:', error);
    return false;
  }
  
  return true;
};

// Subscribe to game changes
export const subscribeToGame = (gameId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`game:${gameId}`)
    .on('postgres_changes', 
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'games',
        filter: `id=eq.${gameId}`
      }, 
      callback
    )
    .subscribe();
};
