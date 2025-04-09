
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { ChessBoard, PieceColor, TimeControl } from './chessTypes';
import { v4 as uuidv4 } from 'uuid';
import { eloChange } from './chessUtils';
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

// Game interface
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
  // We'll handle these fields without database columns
  last_activity?: string; 
  start_time?: string;
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
): Promise<Game | null> => {
  try {
    // Generate a 6-character game code
    const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { data, error } = await supabase
      .from('chess_games')
      .insert({
        host_id: hostId,
        time_control: `${timeControl.minutes}+${timeControl.increment}`,
        time_white: timeControl.startTime,
        time_black: timeControl.startTime,
        stake: stake,
        status: GameStatus.Waiting,
        board_state: boardToJson({}), // Empty board, will be set up on game start
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

    // Convert the data to our Game interface
    return {
      ...data,
      board_state: jsonToBoard(data.board_state)
    } as Game;
  } catch (error) {
    console.error('Error creating game:', error);
    return null;
  }
};

// Get a game by ID
export const getGameById = async (gameId: string): Promise<Game | null> => {
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

    // Convert the data to our Game interface
    return {
      ...data,
      board_state: jsonToBoard(data.board_state)
    } as Game;
  } catch (error) {
    console.error('Error getting game:', error);
    return null;
  }
};

// Get a game by code
export const getGameByCode = async (code: string): Promise<Game | null> => {
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

    // Convert the data to our Game interface
    return {
      ...data,
      board_state: jsonToBoard(data.board_state)
    } as Game;
  } catch (error) {
    console.error('Error getting game by code:', error);
    return null;
  }
};

// Join a game
export const joinGame = async (gameId: string, opponentId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('chess_games')
      .update({ opponent_id: opponentId, status: GameStatus.Active })
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

// Update game state
export const updateGameState = async (
  gameId: string,
  board: ChessBoard,
  moveHistory: string[],
  currentTurn: PieceColor,
  timeWhite: number,
  timeBlack: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('chess_games')
      .update({
        board_state: boardToJson(board),
        move_history: moveHistory,
        current_turn: currentTurn,
        time_white: timeWhite,
        time_black: timeBlack
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
export const getActiveGamesForPlayer = async (playerId: string): Promise<Game[]> => {
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

    // Convert the data to our Game interface
    return data.map(game => ({
      ...game,
      board_state: jsonToBoard(game.board_state)
    })) as Game[];
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
