import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { ChessBoard, PieceColor, TimeControl } from './chessTypes';
import { v4 as uuidv4 } from 'uuid';
import { Json } from '@/integrations/supabase/types';

// Game status enum
export enum GameStatus {
  Waiting = 'waiting',
  Active = 'active',
  Completed = 'completed',
  Aborted = 'aborted'
}

// Game outcome enum
export enum GameOutcome {
  Checkmate = 'checkmate',
  Stalemate = 'stalemate',
  TimeOut = 'timeout',
  Draw = 'draw',
  Resignation = 'resignation',
  Abandoned = 'abandoned'
}

// Game data interface that matches the database schema
export interface GameData {
  id: string;
  host_id: string;
  opponent_id?: string;
  stake: number;
  time_control: string;
  time_white: number;
  time_black: number;
  status: GameStatus;
  winner_id?: string;
  board_state: ChessBoard;
  move_history: string[];
  current_turn: PieceColor;
  game_code?: string;
  start_time?: string;
  last_activity?: string;
}

// Game interface (same as GameData but with optional id for creation)
export interface Game {
  id?: string;
  host_id: string;
  opponent_id?: string;
  stake: number;
  time_control: string;
  time_white: number;
  time_black: number;
  status: GameStatus;
  winner_id?: string;
  board_state: ChessBoard;
  move_history: string[];
  current_turn: PieceColor;
  game_code?: string;
  start_time?: string;
  last_activity?: string;
}

// Convert ChessBoard to JSON-compatible object
const boardToJson = (board: ChessBoard): Json => {
  // Create a plain object through JSON serialization to remove any circular references or methods
  const plainObject = JSON.parse(JSON.stringify(board));
  return plainObject as unknown as Json;
};

// Convert JSON back to ChessBoard
const jsonToBoard = (json: any): ChessBoard => {
  return json as ChessBoard;
};

// Create a new game in the database
export const createGame = async (
  hostId: string,
  timeControl: TimeControl,
  stake: number = 0
): Promise<string | null> => {
  try {
    // Generate a 6-character game code
    const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Create an empty board structure that aligns with ChessBoard type
    const emptyBoard: ChessBoard = {
      squares: [],
      currentTurn: 'white',
      selectedSquare: null,
      validMoves: [],
      capturedPieces: [],
      moveHistory: [],
      whiteTime: timeControl.startTime,
      blackTime: timeControl.startTime,
      isTimerRunning: false,
      gameOver: false,
      winner: null
    };
    
    const { data, error } = await supabase
      .from('chess_games')
      .insert({
        host_id: hostId,
        time_control: `${timeControl.type}`,
        time_white: timeControl.startTime,
        time_black: timeControl.startTime,
        stake: stake,
        status: GameStatus.Waiting,
        board_state: boardToJson(emptyBoard),
        move_history: [],
        current_turn: 'white',
        game_code: gameCode
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating game:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error creating game:', error);
    return null;
  }
};

// Get a game by ID
export const getGameById = async (gameId: string): Promise<GameData | null> => {
  try {
    const { data, error } = await supabase
      .from('chess_games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (error) {
      console.error('Error getting game:', error);
      return null;
    }

    // Convert the data to our GameData interface
    return {
      ...data,
      board_state: jsonToBoard(data.board_state),
      move_history: Array.isArray(data.move_history) ? data.move_history : []
    } as GameData;
  } catch (error) {
    console.error('Error getting game:', error);
    return null;
  }
};

// Get a game by code
export const getGameByCode = async (code: string): Promise<GameData | null> => {
  try {
    const { data, error } = await supabase
      .from('chess_games')
      .select('*')
      .eq('game_code', code)
      .maybeSingle();

    if (error || !data) {
      console.error('Error getting game by code:', error || 'Game not found');
      return null;
    }

    // Convert the data to our GameData interface
    return {
      ...data,
      board_state: jsonToBoard(data.board_state),
      move_history: Array.isArray(data.move_history) ? data.move_history : []
    } as GameData;
  } catch (error) {
    console.error('Error getting game by code:', error);
    return null;
  }
};

// Join a game
export const joinGame = async (gameId: string, opponentId: string): Promise<boolean> => {
  try {
    // First, check if the user is trying to join their own game
    const { data: gameData, error: getError } = await supabase
      .from('chess_games')
      .select('host_id')
      .eq('id', gameId)
      .single();
    
    if (getError) {
      console.error('Error checking game data:', getError);
      return false;
    }
    
    // Prevent joining own game
    if (gameData.host_id === opponentId) {
      console.error('Cannot join your own game');
      return false;
    }

    const { data, error } = await supabase
      .from('chess_games')
      .update({ 
        opponent_id: opponentId, 
        status: GameStatus.Active,
        start_time: new Date().toISOString() 
      })
      .eq('id', gameId)
      .select();

    if (error) {
      console.error('Error joining game:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error joining game:', error);
    return false;
  }
};

// Start a game (helper function for game initialization)
export const startGame = async (gameId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('chess_games')
      .update({ 
        status: GameStatus.Active,
        start_time: new Date().toISOString()
      })
      .eq('id', gameId);

    if (error) {
      console.error('Error starting game:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error starting game:', error);
    return false;
  }
};

// Check for game inactivity
export const checkGameInactivity = async (gameId: string): Promise<{ inactive: boolean }> => {
  try {
    const { data, error } = await supabase
      .from('chess_games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (error || !data) {
      console.error('Error checking game inactivity:', error);
      return { inactive: false };
    }

    // Game is considered inactive if no move has been made for 30+ seconds after start
    const startTime = data.start_time ? new Date(data.start_time) : null;
    const now = new Date();
    
    // Check if move_history is an array and has a length property
    const moveHistoryLength = Array.isArray(data.move_history) ? data.move_history.length : 0;
    
    const inactive = startTime && now.getTime() - startTime.getTime() > 30000 && 
                     moveHistoryLength === 0;

    return { inactive };
  } catch (error) {
    console.error('Error checking game inactivity:', error);
    return { inactive: false };
  }
};

// Abort a game
export const abortGame = async (gameId: string, reason: string = 'abandoned'): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('chess_games')
      .update({ 
        status: GameStatus.Aborted,
        // Add reason as a comment if needed
      })
      .eq('id', gameId);

    if (error) {
      console.error('Error aborting game:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error aborting game:', error);
    return false;
  }
};

// Update game state
export const updateGameState = async (
  gameId: string,
  board: ChessBoard,
  moveHistory: string[]
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('chess_games')
      .update({
        board_state: boardToJson(board),
        move_history: moveHistory,
        current_turn: board.currentTurn,
        time_white: board.whiteTime,
        time_black: board.blackTime
      })
      .eq('id', gameId);

    if (error) {
      console.error('Error updating game state:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating game state:', error);
    return false;
  }
};

// End a game
export const endGame = async (
  gameId: string,
  winnerId: string | null,
  status: GameStatus = GameStatus.Completed
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('chess_games')
      .update({
        winner_id: winnerId,
        status: status
      })
      .eq('id', gameId);

    if (error) {
      console.error('Error ending game:', error);
      return false;
    }

    // If there was a winner, update player stats
    if (winnerId) {
      // This would be where we update player stats and handle stake transfers
      console.log(`Player ${winnerId} won game ${gameId}`);
    }

    return true;
  } catch (error) {
    console.error('Error ending game:', error);
    return false;
  }
};

// Get active games for a player
export const getActiveGamesForPlayer = async (playerId: string): Promise<GameData[]> => {
  try {
    const { data, error } = await supabase
      .from('chess_games')
      .select('*')
      .or(`host_id.eq.${playerId},opponent_id.eq.${playerId}`)
      .in('status', [GameStatus.Waiting, GameStatus.Active]);

    if (error) {
      console.error('Error getting active games:', error);
      return [];
    }

    // Convert the data to our GameData interface
    return data.map(game => ({
      ...game,
      board_state: jsonToBoard(game.board_state),
      move_history: Array.isArray(game.move_history) ? game.move_history : []
    })) as GameData[];
  } catch (error) {
    console.error('Error getting active games:', error);
    return [];
  }
};

// Get a player's wallet profile or create if it doesn't exist
export const getOrCreateWalletProfile = async (walletAddress: string) => {
  try {
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('wallet_profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching wallet profile:', fetchError);
      return null;
    }

    // If profile exists, return it
    if (existingProfile) {
      return existingProfile;
    }

    // If profile doesn't exist, create it
    const { data: newProfile, error: insertError } = await supabase
      .from('wallet_profiles')
      .insert({
        wallet_address: walletAddress,
        games_played: 0,
        games_won: 0,
        games_lost: 0,
        total_sol_staked: 0,
        total_sol_won: 0,
        last_active: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating wallet profile:', insertError);
      return null;
    }

    return newProfile;
  } catch (error) {
    console.error('Error in getOrCreateWalletProfile:', error);
    return null;
  }
};

// Get all available games
export const getAllGames = async (): Promise<GameData[]> => {
  try {
    const { data, error } = await supabase
      .from('chess_games')
      .select('*')
      .eq('status', GameStatus.Waiting)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting all games:', error);
      return [];
    }

    return data.map(game => ({
      ...game,
      board_state: jsonToBoard(game.board_state),
      move_history: Array.isArray(game.move_history) ? game.move_history : []
    })) as GameData[];
  } catch (error) {
    console.error('Error getting all games:', error);
    return [];
  }
};

// Get games created by a specific user
export const getGamesCreatedByUser = async (userId: string): Promise<GameData[]> => {
  try {
    const { data, error } = await supabase
      .from('chess_games')
      .select('*')
      .eq('host_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting games by user:', error);
      return [];
    }

    return data.map(game => ({
      ...game,
      board_state: jsonToBoard(game.board_state),
      move_history: Array.isArray(game.move_history) ? game.move_history : []
    })) as GameData[];
  } catch (error) {
    console.error('Error getting games by user:', error);
    return [];
  }
};

// Create a function to subscribe to real-time changes on a game
export const subscribeToGame = (gameId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`game-${gameId}`)
    .on(
      'postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'chess_games',
        filter: `id=eq.${gameId}` 
      }, 
      callback
    )
    .subscribe();
};

// Re-export supabase client from the integration
export { supabase } from '@/integrations/supabase/client';
