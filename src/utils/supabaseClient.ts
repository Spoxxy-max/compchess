
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { ChessBoard, PieceColor } from './chessTypes';

// Game-related functions
export interface CreateGameParams {
  hostId: string;
  timeControl: string;
  timeIncrement: number;
  stake: number;
  initialBoard: ChessBoard;
}

export interface GameData {
  id: string;
  host_id: string;
  opponent_id?: string;
  time_control: string;
  time_white: number;
  time_black: number;
  stake: number;
  status: 'waiting' | 'active' | 'completed';
  winner_id?: string;
  created_at: string;
  board_state: ChessBoard;
  move_history: string[];
  current_turn: PieceColor;
}

// Create a new game in Supabase
export const createGame = async (params: CreateGameParams): Promise<GameData | null> => {
  const { hostId, timeControl, timeIncrement, stake, initialBoard } = params;
  
  const startTime = initialBoard.whiteTime; // Both white and black have the same starting time
  
  const { data, error } = await supabase
    .from('chess_games')
    .insert({
      host_id: hostId,
      time_control: timeControl,
      time_white: startTime,
      time_black: startTime,
      stake: stake,
      status: 'waiting',
      board_state: initialBoard,
      move_history: [],
      current_turn: 'white'
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
    .from('chess_games')
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
    .from('chess_games')
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
  boardState: ChessBoard, 
  moveHistory: string[]
): Promise<boolean> => {
  const { error } = await supabase
    .from('chess_games')
    .update({ 
      board_state: boardState,
      move_history: moveHistory,
      current_turn: boardState.currentTurn,
      time_white: boardState.whiteTime,
      time_black: boardState.blackTime
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
    .from('chess_games')
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
        table: 'chess_games',
        filter: `id=eq.${gameId}`
      }, 
      callback
    )
    .subscribe();
};
