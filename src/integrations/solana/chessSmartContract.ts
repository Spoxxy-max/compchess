
import { executeSmartContractMethod } from './smartContract';
import { PublicKey } from '@solana/web3.js';

// This file will be populated with the actual IDL once provided
let chessGameIDL: any = null;

// Function to load and set the IDL
export const initializeGameIDL = (idl: any) => {
  chessGameIDL = idl;
  console.log('Chess Game IDL initialized:', chessGameIDL);
  return true;
};

// Check if IDL is loaded
export const isIDLInitialized = () => {
  return chessGameIDL !== null;
};

// Game contract interface with Solana-specific methods
export interface ChessGameContract {
  // Create a new chess game with a stake
  createGame: (stake: number, timeControl: number) => Promise<{ gameId: string, txId: string }>;
  
  // Join a game with the required stake
  joinGame: (gameId: string, stake: number) => Promise<{ success: boolean, txId: string }>;
  
  // Confirm the start of the game (after both players have joined)
  confirmStart: (gameId: string) => Promise<boolean>;
  
  // Make a move on the chess board
  makeMove: (gameId: string, move: string) => Promise<boolean>;
  
  // Claim victory (e.g., on checkmate or timeout)
  claimVictory: (gameId: string, reason: string) => Promise<boolean>;
  
  // Claim a draw (e.g., stalemate, insufficient material)
  claimDraw: (gameId: string, reason: string) => Promise<boolean>;
  
  // Abort the game (e.g., disconnect, inactivity)
  abortGame: (gameId: string, reason: string) => Promise<boolean>;
  
  // Withdraw staked funds after game completion
  withdrawFunds: (gameId: string) => Promise<{ success: boolean, amount: number }>;
  
  // Get game state from the contract
  getGameState: (gameId: string) => Promise<any>;
  
  // Get a user's active games
  getUserGames: (userAddress: string) => Promise<string[]>;
}

// Placeholder functions to be implemented with actual smart contract calls
export const chessGameContract = {
  createGame: async (stake: number, timeControl: number) => {
    console.log(`Creating game with stake ${stake} SOL and time control ${timeControl}`);
    try {
      // This will be replaced with actual smart contract call
      const result = await executeSmartContractMethod('createGame', [stake, timeControl]);
      return { 
        gameId: result.data, 
        txId: `tx_${Math.random().toString(36).substring(2, 10)}` 
      };
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  },
  
  joinGame: async (gameId: string, stake: number) => {
    console.log(`Joining game ${gameId} with stake ${stake} SOL`);
    try {
      // This will be replaced with actual smart contract call
      const result = await executeSmartContractMethod('joinGame', [gameId]);
      return { 
        success: result.success, 
        txId: `tx_${Math.random().toString(36).substring(2, 10)}` 
      };
    } catch (error) {
      console.error('Error joining game:', error);
      throw error;
    }
  },
  
  confirmStart: async (gameId: string) => {
    console.log(`Confirming start of game ${gameId}`);
    // Implementation will be added with actual smart contract
    return true;
  },
  
  makeMove: async (gameId: string, move: string) => {
    console.log(`Making move in game ${gameId}: ${move}`);
    // Implementation will be added with actual smart contract
    return true;
  },
  
  claimVictory: async (gameId: string, reason: string) => {
    console.log(`Claiming victory in game ${gameId} due to ${reason}`);
    // Implementation will be added with actual smart contract
    return true;
  },
  
  claimDraw: async (gameId: string, reason: string) => {
    console.log(`Claiming draw in game ${gameId} due to ${reason}`);
    // Implementation will be added with actual smart contract
    return true;
  },
  
  abortGame: async (gameId: string, reason: string) => {
    console.log(`Aborting game ${gameId} due to ${reason}`);
    try {
      // This will be replaced with actual smart contract call
      const result = await executeSmartContractMethod('claimVictory', [gameId]);
      return result.success;
    } catch (error) {
      console.error('Error aborting game:', error);
      return false;
    }
  },
  
  withdrawFunds: async (gameId: string) => {
    console.log(`Withdrawing funds from game ${gameId}`);
    try {
      // This will be replaced with actual smart contract call
      const result = await executeSmartContractMethod('withdrawWinnings', [gameId]);
      return { 
        success: result.success, 
        amount: 1.0 // Mock amount
      };
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      return { success: false, amount: 0 };
    }
  },
  
  getGameState: async (gameId: string) => {
    console.log(`Getting state for game ${gameId}`);
    // Implementation will be added with actual smart contract
    return {
      gameId,
      active: true,
      white: "player1",
      black: "player2",
      stake: 1.0,
      moveHistory: [],
      timeControl: 300, // 5 minutes
    };
  },
  
  getUserGames: async (userAddress: string) => {
    console.log(`Getting games for user ${userAddress}`);
    // Implementation will be added with actual smart contract
    return [`game_${Math.random().toString(36).substring(2, 10)}`];
  }
};

// Function to execute Chess Game Contract method with error handling
export const executeChessContractMethod = async (
  method: keyof ChessGameContract,
  params: any[] = []
): Promise<any> => {
  if (!isIDLInitialized()) {
    console.error('Chess Game IDL not initialized');
    return { success: false, error: { message: 'Chess Game IDL not initialized' } };
  }
  
  try {
    console.log(`Executing chess contract method: ${method} with params:`, params);
    
    // @ts-ignore
    const result = await chessGameContract[method](...params);
    return { success: true, data: result };
  } catch (error) {
    console.error(`Error executing chess contract method ${method}:`, error);
    return { success: false, error };
  }
};
