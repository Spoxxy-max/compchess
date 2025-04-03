
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { ChessBoard, PieceColor, TimeControl } from './chessTypes';
import { Json } from '@/integrations/supabase/types';

// Game-related functions
export interface CreateGameParams {
  hostId: string;
  timeControl: TimeControl;
  stake: number;
  initialBoard?: ChessBoard;
}

export interface GameData {
  id: string;
  host_id: string;
  opponent_id?: string;
  time_control: string;
  time_white: number;
  time_black: number;
  stake: number;
  status: 'waiting' | 'active' | 'completed' | 'aborted';
  winner_id?: string;
  created_at: string;
  board_state: ChessBoard;
  move_history: string[];
  current_turn: PieceColor;
  // We'll handle these fields without database columns
  last_activity?: string; 
  start_time?: string;
}

// Convert ChessBoard to JSON-compatible object
const boardToJson = (board: ChessBoard): Json => {
  return board as unknown as Json;
};

// Convert JSON back to ChessBoard
const jsonToBoard = (json: Json): ChessBoard => {
  return json as unknown as ChessBoard;
};

// Create a new game in Supabase
export const createGame = async (
  hostId: string,
  timeControl: TimeControl,
  stake: number
): Promise<string | null> => {
  console.log("Creating new game with params:", { hostId, timeControl, stake });
  
  const startTime = timeControl.startTime; // Start time in seconds
  
  // Store stake with precision up to 6 decimal places for small amounts (lamports)
  const formattedStake = parseFloat(stake.toFixed(6));
  
  const initialBoard = {
    whiteTime: startTime,
    blackTime: startTime,
    currentTurn: 'white' as PieceColor,
    // Other board state properties will be added by the game engine
  } as unknown as ChessBoard;
  
  const { data, error } = await supabase
    .from('chess_games')
    .insert({
      host_id: hostId,
      time_control: timeControl.type,
      time_white: startTime,
      time_black: startTime,
      stake: formattedStake,
      status: 'waiting' as const,
      board_state: boardToJson(initialBoard),
      move_history: [],
      current_turn: 'white'
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating game:', error);
    return null;
  }
  
  console.log("Game created successfully:", data);
  
  return data.id;
};

// Get a game by ID
export const getGameById = async (gameId: string): Promise<GameData | null> => {
  console.log(`Fetching game with ID: ${gameId}`);
  
  const { data, error } = await supabase
    .from('chess_games')
    .select('*')
    .eq('id', gameId)
    .single();
    
  if (error) {
    console.error('Error fetching game:', error);
    return null;
  }
  
  if (!data) {
    console.log(`No game found with ID: ${gameId}`);
    return null;
  }
  
  console.log(`Found game with ID: ${gameId}`, data);
  
  return {
    ...data,
    board_state: jsonToBoard(data.board_state),
    move_history: Array.isArray(data.move_history) ? data.move_history.map(move => String(move)) : [],
    status: data.status as 'waiting' | 'active' | 'completed' | 'aborted',
    current_turn: data.current_turn as PieceColor,
    last_activity: new Date().toISOString()
  };
};

// Join an existing game
export const joinGame = async (gameId: string, opponentId: string): Promise<boolean> => {
  console.log(`Attempting to join game ${gameId} as ${opponentId}`);
  
  // First, check if the game exists and is available to join
  const { data: game, error: gameError } = await supabase
    .from('chess_games')
    .select('*')
    .eq('id', gameId)
    .eq('status', 'waiting')
    .single();
    
  if (gameError || !game) {
    console.error('Error finding game or game not available:', gameError);
    return false;
  }
  
  // Prevent joining own game
  if (game.host_id === opponentId) {
    console.error('Cannot join your own game');
    return false;
  }
  
  // Update game with opponent and set status to active
  const { error } = await supabase
    .from('chess_games')
    .update({ 
      opponent_id: opponentId,
      status: 'active' as const
    })
    .eq('id', gameId)
    .eq('status', 'waiting');
    
  if (error) {
    console.error('Error joining game:', error);
    return false;
  }
  
  console.log(`Successfully joined game ${gameId}`);
  return true;
};

// Get available games (excluding games created by the current user)
export const getAvailableGames = async (currentUserId?: string): Promise<GameData[]> => {
  console.log("Fetching available games, excluding user:", currentUserId);
  
  let query = supabase
    .from('chess_games')
    .select('*')
    .eq('status', 'waiting')
    .order('created_at', { ascending: false });
  
  // If currentUserId is provided, exclude games created by the current user
  if (currentUserId) {
    query = query.neq('host_id', currentUserId);
  }
    
  const { data, error } = await query;
    
  if (error) {
    console.error('Error fetching available games:', error);
    return [];
  }
  
  console.log(`Found ${data?.length || 0} available games`);
  
  return (data || []).map(game => ({
    ...game,
    // Ensure stake is properly formatted as a number
    stake: typeof game.stake === 'string' ? parseFloat(game.stake) : game.stake,
    board_state: jsonToBoard(game.board_state),
    move_history: Array.isArray(game.move_history) ? game.move_history.map(move => String(move)) : [],
    status: game.status as 'waiting' | 'active' | 'completed' | 'aborted',
    current_turn: game.current_turn as PieceColor,
    last_activity: new Date().toISOString()
  }));
};

// Start the game after countdown
export const startGame = async (gameId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('chess_games')
    .update({
      status: 'active' as const
    })
    .eq('id', gameId);
    
  if (error) {
    console.error('Error starting game:', error);
    return false;
  }
  
  return true;
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
      board_state: boardToJson(boardState),
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
      status: 'completed' as const,
      winner_id: winnerId
    })
    .eq('id', gameId);
    
  if (error) {
    console.error('Error ending game:', error);
    return false;
  }
  
  return true;
};

// Abort game due to inactivity or other reason
export const abortGame = async (gameId: string, reason: string): Promise<boolean> => {
  const { error } = await supabase
    .from('chess_games')
    .update({ 
      status: 'aborted' as const
    })
    .eq('id', gameId);
    
  if (error) {
    console.error(`Error aborting game: ${reason}`, error);
    return false;
  }
  
  return true;
};

// Check for inactivity (e.g., black didn't make first move within 30 seconds)
export const checkGameInactivity = async (gameId: string): Promise<{ inactive: boolean, lastActivity: string }> => {
  const { data, error } = await supabase
    .from('chess_games')
    .select('move_history, status')
    .eq('id', gameId)
    .single();
    
  if (error || !data) {
    console.error('Error checking game inactivity:', error);
    return { inactive: false, lastActivity: new Date().toISOString() };
  }
  
  // Only check active games
  if (data.status !== 'active') {
    return { inactive: false, lastActivity: new Date().toISOString() };
  }
  
  // Calculate inactivity time
  const now = new Date();
  const lastActivity = now.toISOString();
  const inactivitySeconds = 30; // Assume 30 seconds for simplicity
  
  // First move not made within 30 seconds of start
  // Fix: Check if move_history is an array before accessing length property
  const noMoves = !data.move_history || (Array.isArray(data.move_history) && data.move_history.length === 0);
  
  // Consider inactive if no moves made within 30 seconds of game start
  const inactive = noMoves && inactivitySeconds > 30;
  
  return { 
    inactive, 
    lastActivity
  };
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

// Set up realtime synchronization for the chess game
export const setupGameRealtime = (gameId: string, onGameUpdate: (game: GameData) => void) => {
  console.log(`Setting up realtime sync for game: ${gameId}`);
  
  // Create a channel subscription for this specific game
  const channel = supabase
    .channel(`game-updates:${gameId}`)
    .on('postgres_changes', 
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chess_games',
        filter: `id=eq.${gameId}`
      },
      async (payload) => {
        console.log('Game update received:', payload);
        
        // Fetch the latest game state to ensure we have complete data
        const updatedGame = await getGameById(gameId);
        
        if (updatedGame) {
          console.log('Forwarding updated game state to UI');
          onGameUpdate(updatedGame);
        }
      }
    )
    .subscribe();
    
  console.log('Realtime subscription established');
  
  // Return unsubscribe function
  return () => {
    console.log('Cleaning up realtime subscription');
    supabase.removeChannel(channel);
  };
};

export { supabase };
