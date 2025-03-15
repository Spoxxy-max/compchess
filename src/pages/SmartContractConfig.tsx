import React from 'react';
import Header from '../components/Header';
import IDLLoader from '../components/IDLLoader';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';
import { isIDLInitialized } from '../integrations/solana/chessSmartContract';
import { useToast } from "@/hooks/use-toast";

const SmartContractConfig: React.FC = () => {
  const navigate = useNavigate();

  // Sample Solana Smart Contract for chess game
  const sampleContract = `// This is a simplified Solana smart contract for the chess game
// You can use this as a reference for building your own contract
// in Solana Playground or Anchor

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use std::mem::size_of;

declare_id!("ChsGP8RrYM2dfgVV1pjryNbHFiXA5g7uvCc5MfQE8Uz");

#[program]
pub mod chess_game {
    use super::*;

    // Initialize the chess program
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    // Create a new chess game with a stake
    pub fn create_game(
        ctx: Context<CreateGame>,
        stake_amount: u64,
        time_control: u64,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = &ctx.accounts.player;
        
        game.host = player.key();
        game.stake = stake_amount;
        game.time_control = time_control;
        game.status = GameStatus::Waiting as u8;
        game.created_at = Clock::get()?.unix_timestamp;
        
        // Handle stake transfer if stake amount > 0
        if stake_amount > 0 {
            // Transfer tokens from player to game account
            let transfer_instruction = Transfer {
                from: ctx.accounts.player_token_account.to_account_info(),
                to: ctx.accounts.game_token_account.to_account_info(),
                authority: player.to_account_info(),
            };
            
            let cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                transfer_instruction,
            );
            
            token::transfer(cpi_ctx, stake_amount)?;
        }
        
        Ok(())
    }

    // Join an existing game
    pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = &ctx.accounts.player;
        
        // Ensure game is in waiting status
        require!(
            game.status == GameStatus::Waiting as u8,
            ChessError::InvalidGameStatus
        );
        
        // Set opponent
        game.opponent = Some(player.key());
        game.status = GameStatus::Active as u8;
        
        // Handle stake transfer if stake amount > 0
        if game.stake > 0 {
            // Transfer tokens from player to game account
            let transfer_instruction = Transfer {
                from: ctx.accounts.player_token_account.to_account_info(),
                to: ctx.accounts.game_token_account.to_account_info(),
                authority: player.to_account_info(),
            };
            
            let cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                transfer_instruction,
            );
            
            token::transfer(cpi_ctx, game.stake)?;
        }
        
        Ok(())
    }

    // Make a move on the chess board
    pub fn make_move(
        ctx: Context<MakeMove>,
        from: String,
        to: String,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = &ctx.accounts.player;
        
        // Ensure game is active
        require!(
            game.status == GameStatus::Active as u8,
            ChessError::InvalidGameStatus
        );
        
        // Verify it's the player's turn
        let is_white_turn = game.moves.len() % 2 == 0;
        let is_white_player = player.key() == game.host;
        let is_black_player = game.opponent.is_some() && player.key() == game.opponent.unwrap();
        
        require!(
            (is_white_turn && is_white_player) || (!is_white_turn && is_black_player),
            ChessError::NotPlayerTurn
        );
        
        // Add move to history
        game.moves.push(format!("{}-{}", from, to));
        
        // Update timestamps
        let current_time = Clock::get()?.unix_timestamp;
        
        if is_white_turn {
            game.last_white_move = current_time;
        } else {
            game.last_black_move = current_time;
        }
        
        Ok(())
    }

    // Claim victory (e.g., checkmate or timeout)
    pub fn claim_victory(ctx: Context<ClaimVictory>, reason: String) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = &ctx.accounts.player;
        
        // Ensure game is active
        require!(
            game.status == GameStatus::Active as u8,
            ChessError::InvalidGameStatus
        );
        
        // For timeout, verify that the opponent has not moved within the time limit
        if reason == "timeout" {
            let current_time = Clock::get()?.unix_timestamp;
            let is_white_player = player.key() == game.host;
            
            if is_white_player {
                // Check if black timed out
                require!(
                    game.last_black_move + game.time_control as i64 < current_time,
                    ChessError::TimeoutNotReached
                );
            } else {
                // Check if white timed out
                require!(
                    game.last_white_move + game.time_control as i64 < current_time,
                    ChessError::TimeoutNotReached
                );
            }
        }
        
        // Set game as completed with winner
        game.status = GameStatus::Completed as u8;
        game.winner = Some(player.key());
        game.end_reason = Some(reason);
        
        Ok(())
    }

    // Claim a draw (e.g., stalemate)
    pub fn claim_draw(ctx: Context<ClaimDraw>, reason: String) -> Result<()> {
        let game = &mut ctx.accounts.game;
        
        // Ensure game is active
        require!(
            game.status == GameStatus::Active as u8,
            ChessError::InvalidGameStatus
        );
        
        // Set game as completed with no winner (draw)
        game.status = GameStatus::Completed as u8;
        game.winner = None;
        game.end_reason = Some(reason);
        
        Ok(())
    }

    // Withdraw winnings after game completion
    pub fn withdraw_funds(ctx: Context<WithdrawFunds>) -> Result<()> {
        let game = &ctx.accounts.game;
        let player = &ctx.accounts.player;
        
        // Ensure game is completed
        require!(
            game.status == GameStatus::Completed as u8,
            ChessError::InvalidGameStatus
        );
        
        // Ensure the player is the winner or it's a draw
        require!(
            game.winner.is_none() || game.winner.unwrap() == player.key(),
            ChessError::NotWinner
        );
        
        // Return staked funds
        let stake_amount = if game.winner.is_some() {
            // Winner gets both stakes
            game.stake * 2
        } else {
            // In case of a draw, return original stake
            game.stake
        };
        
        // Only process if stake amount > 0
        if stake_amount > 0 {
            let seeds = &[
                b"game".as_ref(),
                &game.to_account_info().key.to_bytes(),
                &[game.bump],
            ];
            let signer = &[&seeds[..]];
            
            let transfer_instruction = Transfer {
                from: ctx.accounts.game_token_account.to_account_info(),
                to: ctx.accounts.player_token_account.to_account_info(),
                authority: ctx.accounts.game_authority.to_account_info(),
            };
            
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_instruction,
                signer,
            );
            
            token::transfer(cpi_ctx, stake_amount)?;
        }
        
        Ok(())
    }

    // Abort game due to inactivity or other reason
    pub fn abort_game(ctx: Context<AbortGame>, reason: String) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = &ctx.accounts.player;
        
        // Ensure game is in active or waiting status
        require!(
            game.status == GameStatus::Active as u8 || game.status == GameStatus::Waiting as u8,
            ChessError::InvalidGameStatus
        );
        
        // For inactivity, verify that the first move wasn't made within 30 seconds
        if reason == "inactivity" && game.status == GameStatus::Active as u8 {
            let current_time = Clock::get()?.unix_timestamp;
            let game_start_time = if game.moves.is_empty() {
                // If no moves, check time since opponent joined
                game.last_white_move
            } else {
                // Otherwise check time since last move
                let is_white_turn = game.moves.len() % 2 == 0;
                if is_white_turn {
                    game.last_black_move
                } else {
                    game.last_white_move
                }
            };
            
            require!(
                current_time - game_start_time > 30, // 30 seconds inactivity
                ChessError::InactivityTimeNotReached
            );
        }
        
        // Set game as aborted
        game.status = GameStatus::Aborted as u8;
        game.end_reason = Some(reason);
        
        // Return stakes if any
        if game.stake > 0 {
            // Return stake to the host
            let seeds = &[
                b"game".as_ref(),
                &game.to_account_info().key.to_bytes(),
                &[game.bump],
            ];
            let signer = &[&seeds[..]];
            
            // Return host stake
            let transfer_instruction = Transfer {
                from: ctx.accounts.game_token_account.to_account_info(),
                to: ctx.accounts.host_token_account.to_account_info(),
                authority: ctx.accounts.game_authority.to_account_info(),
            };
            
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_instruction,
                signer,
            );
            
            token::transfer(cpi_ctx, game.stake)?;
            
            // If opponent has joined and staked, return their stake too
            if game.opponent.is_some() && player.key() == game.opponent.unwrap() {
                let transfer_instruction = Transfer {
                    from: ctx.accounts.game_token_account.to_account_info(),
                    to: ctx.accounts.player_token_account.to_account_info(),
                    authority: ctx.accounts.game_authority.to_account_info(),
                };
                
                let cpi_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    transfer_instruction,
                    signer,
                );
                
                token::transfer(cpi_ctx, game.stake)?;
            }
        }
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = 8 + size_of::<ChessProgramState>(),
    )]
    pub program_state: Account<'info, ChessProgramState>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateGame<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        init,
        payer = player,
        space = 8 + size_of::<ChessGame>() + 200, // Extra space for moves
        seeds = [b"game", player.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub game: Account<'info, ChessGame>,
    pub player_token_account: Account<'info, TokenAccount>,
    pub game_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut)]
    pub game: Account<'info, ChessGame>,
    pub player_token_account: Account<'info, TokenAccount>,
    pub game_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct MakeMove<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut)]
    pub game: Account<'info, ChessGame>,
}

#[derive(Accounts)]
pub struct ClaimVictory<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut)]
    pub game: Account<'info, ChessGame>,
}

#[derive(Accounts)]
pub struct ClaimDraw<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut)]
    pub game: Account<'info, ChessGame>,
}

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut)]
    pub game: Account<'info, ChessGame>,
    /// CHECK: This is the PDA that controls the game's token account
    #[account(
        seeds = [b"game", game.key().as_ref()],
        bump = game.bump,
    )]
    pub game_authority: AccountInfo<'info>,
    #[account(mut)]
    pub game_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub player_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AbortGame<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut)]
    pub game: Account<'info, ChessGame>,
    /// CHECK: This is the PDA that controls the game's token account
    #[account(
        seeds = [b"game", game.key().as_ref()],
        bump = game.bump,
    )]
    pub game_authority: AccountInfo<'info>,
    #[account(mut)]
    pub game_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub player_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub host_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct ChessProgramState {
    pub admin: Pubkey,
    pub game_count: u64,
}

#[account]
pub struct ChessGame {
    pub host: Pubkey,
    pub opponent: Option<Pubkey>,
    pub stake: u64,
    pub time_control: u64,
    pub status: u8,
    pub created_at: i64,
    pub last_white_move: i64,
    pub last_black_move: i64,
    pub winner: Option<Pubkey>,
    pub end_reason: Option<String>,
    pub moves: Vec<String>,
    pub bump: u8,
}

#[error_code]
pub enum ChessError {
    #[msg("Invalid game status for this operation")]
    InvalidGameStatus,
    #[msg("Not player's turn")]
    NotPlayerTurn,
    #[msg("Timeout condition not met")]
    TimeoutNotReached,
    #[msg("Player is not the winner")]
    NotWinner,
    #[msg("Inactivity time not reached")]
    InactivityTimeNotReached,
}

#[derive(Clone, Copy, PartialEq)]
pub enum GameStatus {
    Waiting = 0,
    Active = 1,
    Completed = 2,
    Aborted = 3,
}`;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header 
        onNewGame={() => navigate('/game/new')}
        onJoinGame={() => navigate('/')}
      />
      
      <div className="container px-4 py-8 flex-1">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <span className="bg-solana h-5 w-1 mr-3 rounded-full"></span>
          Smart Contract Configuration
        </h1>
        
        <Tabs defaultValue="idl" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="idl">IDL Configuration</TabsTrigger>
            <TabsTrigger value="contract">Sample Contract</TabsTrigger>
          </TabsList>
          
          <TabsContent value="idl" className="space-y-6">
            <div className="max-w-3xl mx-auto">
              <p className="text-gray-400 mb-6">
                To enable on-chain staking functionality, paste the IDL JSON from your deployed Solana smart contract. 
                This will connect the application to your chess game smart contract on the Solana blockchain.
              </p>
              
              <IDLLoader />
            </div>
          </TabsContent>
          
          <TabsContent value="contract">
            <Card>
              <CardHeader>
                <CardTitle>Sample Solana Smart Contract</CardTitle>
                <CardDescription>
                  This is a simplified example of a chess game smart contract for Solana. 
                  You can use this as a starting point to build your own contract using Anchor or Solana Playground.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-black/50 p-4 rounded-lg overflow-auto max-h-[600px] text-sm font-mono">
                    <code>{sampleContract}</code>
                  </pre>
                  <Button 
                    className="absolute top-2 right-2"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(sampleContract);
                      const { toast } = useToast();
                      toast({
                        title: "Copied to clipboard",
                        description: "The sample contract has been copied to your clipboard."
                      });
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end mt-8">
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            className="mr-2"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => navigate('/')}
            className="bg-solana hover:bg-solana-dark"
          >
            Save & Return
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SmartContractConfig;
