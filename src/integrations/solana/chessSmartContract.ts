
import { executeSmartContractMethod, buildStakingTransaction, solToLamports, lamportsToSol } from './smartContract';
import { PublicKey, Connection, Transaction, SystemProgram, clusterApiUrl } from '@solana/web3.js';
import { ChessErrorCode, ChessGameAccount, GameStatus } from './walletTypes';

// IDL definition that will be populated
let chessGameIDL: any = null;
let programId: PublicKey | null = null;

// Function to load and set the IDL
export const initializeGameIDL = (idl: any) => {
  chessGameIDL = idl;
  try {
    programId = new PublicKey(idl.programId || "ChsGP8RrYM2dfgVV1pjryNbHFiXA5g7uvCc5MfQE8Uz");
    console.log('Chess Game IDL initialized with program ID:', programId.toString());
    return true;
  } catch (error) {
    console.error('Error initializing Chess Game IDL:', error);
    return false;
  }
};

// Check if IDL is loaded
export const isIDLInitialized = () => {
  return chessGameIDL !== null;
};

// Map error codes to messages
const getErrorMessage = (code: number): string => {
  switch (code) {
    case ChessErrorCode.InvalidGameStatus:
      return "Invalid game status for this operation";
    case ChessErrorCode.NotPlayerTurn:
      return "Not player's turn";
    case ChessErrorCode.TimeoutNotReached:
      return "Timeout condition not met";
    case ChessErrorCode.NotWinner:
      return "Player is not the winner";
    case ChessErrorCode.InactivityTimeNotReached:
      return "Inactivity time not reached";
    case ChessErrorCode.InvalidMove:
      return "Invalid chess move";
    case ChessErrorCode.InsufficientFunds:
      return "Insufficient funds for this operation";
    case ChessErrorCode.InvalidReason:
      return "Invalid reason provided";
    default:
      return `Unknown error: ${code}`;
  }
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
  makeMove: (gameId: string, fromSquare: string, toSquare: string) => Promise<boolean>;
  
  // Claim victory (e.g., on checkmate or timeout)
  claimVictory: (gameId: string, reason: string) => Promise<boolean>;
  
  // Claim a draw (e.g., stalemate, insufficient material)
  claimDraw: (gameId: string, reason: string) => Promise<boolean>;
  
  // Abort the game (e.g., disconnect, inactivity)
  abortGame: (gameId: string, reason: string) => Promise<boolean>;
  
  // Withdraw staked funds after game completion
  withdrawFunds: (gameId: string) => Promise<{ success: boolean, amount: number }>;
  
  // Get game state from the contract
  getGameState: (gameId: string) => Promise<ChessGameAccount | null>;
  
  // Get a user's active games
  getUserGames: (userAddress: string) => Promise<string[]>;
}

// Implementation of the contract using the IDL
export const chessGameContract: ChessGameContract = {
  createGame: async (stake: number, timeControl: number) => {
    const stakeLamports = solToLamports(stake);
    console.log(`Creating game with stake ${stake} SOL (${stakeLamports} lamports) and time control ${timeControl}`);
    try {
      if (!programId) throw new Error("Program ID not initialized");
      
      // Connect to devnet explicitly
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      console.log("Connected to Solana devnet for createGame:", connection.rpcEndpoint);
      
      // This will be implemented with actual Solana program call
      const result = await executeSmartContractMethod('createGame', [stakeLamports, timeControl]);
      
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to create game");
      }
      
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
    const stakeLamports = solToLamports(stake);
    console.log(`Joining game ${gameId} with stake ${stake} SOL (${stakeLamports} lamports)`);
    try {
      if (!programId) throw new Error("Program ID not initialized");
      
      // Connect to devnet explicitly
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      console.log("Connected to Solana devnet for joinGame:", connection.rpcEndpoint);
      
      // This will be implemented with actual Solana program call
      const result = await executeSmartContractMethod('joinGame', [gameId]);
      
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to join game");
      }
      
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
    // In our IDL, this is handled automatically by the joinGame instruction
    return true;
  },
  
  makeMove: async (gameId: string, fromSquare: string, toSquare: string) => {
    console.log(`Making move in game ${gameId}: ${fromSquare} to ${toSquare}`);
    try {
      if (!programId) throw new Error("Program ID not initialized");
      
      // Connect to devnet explicitly
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      console.log("Connected to Solana devnet for makeMove:", connection.rpcEndpoint);
      
      // This will be implemented with actual Solana program call to makeMove instruction
      const result = await executeSmartContractMethod('makeMove', [gameId, fromSquare, toSquare]);
      
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to make move");
      }
      
      return result.success;
    } catch (error) {
      console.error('Error making move:', error);
      throw error;
    }
  },
  
  claimVictory: async (gameId: string, reason: string) => {
    console.log(`Claiming victory in game ${gameId} due to ${reason}`);
    try {
      // Connect to devnet explicitly
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      console.log("Connected to Solana devnet for claimVictory:", connection.rpcEndpoint);
      
      // This will be implemented with actual Solana program call
      const result = await executeSmartContractMethod('claimVictory', [gameId, reason]);
      
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to claim victory");
      }
      
      return result.success;
    } catch (error) {
      console.error('Error claiming victory:', error);
      return false;
    }
  },
  
  claimDraw: async (gameId: string, reason: string) => {
    console.log(`Claiming draw in game ${gameId} due to ${reason}`);
    try {
      // Connect to devnet explicitly
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      console.log("Connected to Solana devnet for claimDraw:", connection.rpcEndpoint);
      
      // This will be implemented with actual Solana program call
      const result = await executeSmartContractMethod('claimDraw', [gameId, reason]);
      
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to claim draw");
      }
      
      return result.success;
    } catch (error) {
      console.error('Error claiming draw:', error);
      return false;
    }
  },
  
  abortGame: async (gameId: string, reason: string) => {
    console.log(`Aborting game ${gameId} due to ${reason}`);
    try {
      // Connect to devnet explicitly
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      console.log("Connected to Solana devnet for abortGame:", connection.rpcEndpoint);
      
      // This will be implemented with actual Solana program call
      const result = await executeSmartContractMethod('abortGame', [gameId, reason]);
      
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to abort game");
      }
      
      return result.success;
    } catch (error) {
      console.error('Error aborting game:', error);
      return false;
    }
  },
  
  withdrawFunds: async (gameId: string) => {
    console.log(`Withdrawing funds from game ${gameId}`);
    try {
      // Connect to devnet explicitly
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      console.log("Connected to Solana devnet for withdrawFunds:", connection.rpcEndpoint);
      
      // This will be implemented with actual Solana program call
      const result = await executeSmartContractMethod('withdrawFunds', [gameId]);
      
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to withdraw funds");
      }
      
      return { success: true, amount: 1.0 };
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      return { success: false, amount: 0 };
    }
  },
  
  getGameState: async (gameId: string) => {
    console.log(`Getting state for game ${gameId}`);
    try {
      // Connect to devnet explicitly
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      console.log("Connected to Solana devnet for getGameState:", connection.rpcEndpoint);
      
      // This would fetch the account data from the Solana blockchain
      // For now, we'll return a mock account
      return {
        host: new PublicKey("6RDE3PtriqkHpSfH4QdGQtZ7Ud7j3Tg4PipBEWrBmM6B"),
        opponent: null,
        stake: 1,
        timeControl: 300,
        status: GameStatus.Waiting,
        createdAt: Date.now() / 1000,
        lastWhiteMove: Date.now() / 1000,
        lastBlackMove: 0,
        winner: null,
        endReason: null,
        moves: [],
        bump: 255
      };
    } catch (error) {
      console.error('Error getting game state:', error);
      return null;
    }
  },
  
  getUserGames: async (userAddress: string) => {
    console.log(`Getting games for user ${userAddress}`);
    try {
      // Connect to devnet explicitly
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      console.log("Connected to Solana devnet for getUserGames:", connection.rpcEndpoint);
      
      // This would query all games by pubkey
      // For now, we'll return a mock game ID
      return [`game_${Math.random().toString(36).substring(2, 10)}`];
    } catch (error) {
      console.error('Error getting user games:', error);
      return [];
    }
  }
};

// Create transaction for staking - making sure it's properly exported
export const createStakingTransaction = async (walletPublicKey: string, stake: number, timeControl: number): Promise<Transaction> => {
  if (!walletPublicKey) {
    throw new Error("Wallet public key is required");
  }
  
  try {
    // Connect to devnet explicitly for this transaction
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    console.log("Connected to Solana devnet for createStakingTransaction:", connection.rpcEndpoint);
    
    return await buildStakingTransaction(walletPublicKey, stake, timeControl);
  } catch (error) {
    console.error('Error creating staking transaction:', error);
    throw error;
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
