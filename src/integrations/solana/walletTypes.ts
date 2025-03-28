
import { PublicKey, Transaction } from '@solana/web3.js';

// Wallet adapter interface
export interface WalletAdapter {
  publicKey: string | null;
  connected: boolean;
  balance: number;
  walletName: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction?: (transaction: any) => Promise<any>;
  sendTransaction?: (transaction: Transaction) => Promise<string>;
  signAllTransactions?: (transactions: any[]) => Promise<any[]>;
  signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
}

// Available wallet types
export type WalletType = 'phantom' | 'solflare' | 'trustwallet' | 'backpack' | 'glow' | 'coinbase';

// Chess Game specific types from IDL
export enum GameStatus {
  Waiting = 0,
  Active = 1,
  Completed = 2,
  Aborted = 3
}

export interface ChessGameAccount {
  host: PublicKey;
  opponent: PublicKey | null;
  stake: number;
  timeControl: number;
  status: GameStatus;
  createdAt: number;
  lastWhiteMove: number;
  lastBlackMove: number;
  winner: PublicKey | null;
  endReason: string | null;
  moves: string[];
  bump: number;
}

export interface ChessProgramState {
  admin: PublicKey;
  gameCount: number;
}

// Error codes from IDL
export enum ChessErrorCode {
  InvalidGameStatus = 6000,
  NotPlayerTurn = 6001,
  TimeoutNotReached = 6002,
  NotWinner = 6003,
  InactivityTimeNotReached = 6004,
  InvalidMove = 6005,
  InsufficientFunds = 6006,
  InvalidReason = 6007
}
