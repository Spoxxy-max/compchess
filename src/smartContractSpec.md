
# Chess Game Smart Contract Specification

## Overview

This document specifies a Solana smart contract for a chess game platform with on-chain staking functionality. The contract should manage game creation, joining, gameplay, and stake management.

## Core Functionality

### Game Management
- **Create Game**: Players can create a new chess game with a specified stake and time control
- **Join Game**: Players can join an existing game by matching the stake
- **Make Move**: Players can make chess moves, which are recorded on-chain
- **Claim Victory**: Players can claim victory based on checkmate, timeout, or opponent resignation
- **Claim Draw**: Both players can agree to a draw or claim draw in stalemate situations
- **Abort Game**: Games can be aborted if inactive or by mutual agreement
- **Withdraw Funds**: Winners can withdraw stakes after game completion

### Account Structure

1. **ChessProgramState**: Global program state
   - `admin`: Pubkey - Program administrator
   - `game_count`: u64 - Total number of games created

2. **ChessGame**: Individual game account
   - `host`: Pubkey - Game creator (white player)
   - `opponent`: Option<Pubkey> - Opponent (black player)
   - `stake`: u64 - Stake amount in lamports
   - `time_control`: u64 - Time control in seconds
   - `status`: u8 - Game status (waiting, active, completed, aborted)
   - `created_at`: i64 - Timestamp of game creation
   - `last_white_move`: i64 - Timestamp of last white move
   - `last_black_move`: i64 - Timestamp of last black move
   - `winner`: Option<Pubkey> - Winner of the game
   - `end_reason`: Option<String> - Reason for game ending
   - `moves`: Vec<String> - Move history in algebraic notation
   - `bump`: u8 - PDA bump

### Game Status Enum
- **Waiting**: 0 - Game created but waiting for opponent
- **Active**: 1 - Game in progress
- **Completed**: 2 - Game completed with a winner or draw
- **Aborted**: 3 - Game aborted due to inactivity or other reasons

### Error Codes
- `InvalidGameStatus`: Game not in correct status for operation
- `NotPlayerTurn`: Not the player's turn to make a move
- `TimeoutNotReached`: Timeout claim made before time actually expired
- `NotWinner`: Player is not the winner, can't withdraw
- `InactivityTimeNotReached`: Game inactivity timeout not reached
- `InvalidMove`: Illegal chess move
- `InsufficientFunds`: Insufficient funds for stake

## Instructions

1. **Initialize**
   - Initialize program state
   - Set admin

2. **CreateGame**
   - Parameters: stake_amount (u64), time_control (u64)
   - Create new game account
   - Set host, stake, time_control, status=Waiting
   - Transfer stake to game account if stake > 0

3. **JoinGame**
   - Parameters: game_id (Pubkey)
   - Verify game is in Waiting status
   - Set opponent
   - Set status to Active
   - Transfer stake to game account if stake > 0

4. **MakeMove**
   - Parameters: from (String), to (String)
   - Verify game is Active
   - Verify it's player's turn
   - Record move in move history
   - Update last_move timestamp
   - Verify move legality (optional: can be done client-side)

5. **ClaimVictory**
   - Parameters: reason (String) - "checkmate", "timeout", "resignation"
   - Verify game is Active
   - For timeout, verify opponent has exceeded time limit
   - Set status to Completed
   - Set winner
   - Set end_reason

6. **ClaimDraw**
   - Parameters: reason (String) - "stalemate", "agreement", "insufficient_material"
   - Verify game is Active
   - Set status to Completed
   - Set winner to None
   - Set end_reason

7. **AbortGame**
   - Parameters: reason (String) - "inactivity", "agreement"
   - Verify game is Active or Waiting
   - For inactivity, verify that first move wasn't made within 30 seconds
   - Set status to Aborted
   - Return stakes to players

8. **WithdrawFunds**
   - Parameters: game_id (Pubkey)
   - Verify game is Completed
   - Verify player is the winner or it's a draw
   - Transfer stake funds to winner or return to respective players if draw

## PDAs and Seeds
- Game account: ["game", host_pubkey, timestamp]
- Game authority: ["game", game_pubkey]

## Token Handling
- Stake can be in SOL (native) or SPL tokens
- Game account holds stakes during gameplay
- Winnings transferred to winner after game completion
- In case of draw, stakes returned to players

## Implementation Notes
- Use Anchor framework for smart contract development
- Game state validation should be thorough to prevent exploits
- Consider gas optimization for move recording
- Time control enforcement must be precise
- Implement secure randomness for any random elements
