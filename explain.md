
# CompChess Project Structure

CompChess is a chess platform where users can challenge opponents and compete for SOL stakes in secure matches powered by Solana blockchain. This document explains the structure of the project and how it works.

## Project Overview

The application is a React-based web app with Solana blockchain integration that allows users to:
- Create chess games with customizable time controls and stakes
- Join existing games
- Play chess against opponents with real SOL stakes
- Win rewards based on game outcomes

## Key Folders and Files

### /src
The main source code folder containing all application code.

#### /src/components
UI components used throughout the application.

- **ChessBoard.tsx**: The main chessboard component that renders the game board, handles moves, and manages game state.
- **ChessPiece.tsx**: Component for rendering individual chess pieces with proper styling.
- **CountdownTimer.tsx**: Timer component used for game countdowns and chess clocks.
- **GameBoardFlip.tsx**: Button component that allows users to flip the board view.
- **GameInfo.tsx**: Displays game information like time, captured pieces, and move history.
- **GameStartCountdown.tsx**: Countdown component shown before a game begins.
- **Header.tsx**: Main navigation header with wallet connection and game actions.
- **IDLLoader.tsx**: Component for loading Solana IDL (Interface Definition Language).
- **JoinGameModal.tsx**: Modal for browsing and joining available games.
- **JoinStakeConfirmationModal.tsx**: Modal for confirming stakes when joining games.
- **NewGameModal.tsx**: Modal for creating new chess games with time control and stake options.
- **StakeConfirmationModal.tsx**: Modal for confirming stakes when creating games.
- **TournamentPlaceholder.tsx**: Placeholder for future tournament functionality.
- **VictoryModal.tsx**: Modal displayed at the end of a game showing the winner.
- **WalletSelector.tsx**: Component for connecting various Solana wallets.

#### /src/components/ui
Reusable UI components built with shadcn/ui library for consistent styling.

#### /src/integrations
Integration code for external services and blockchain functionality.

##### /src/integrations/solana
Solana blockchain integration code.

- **adapters/**: Wallet adapters for different Solana wallets (Phantom, Solflare, etc.)
- **chessSmartContract.ts**: Smart contract interaction code for chess games.
- **smartContract.ts**: General smart contract utilities and transaction creation.
- **wallet.ts**: Wallet functionality exports.
- **walletContext.ts**: React context for Solana wallet state.
- **walletTypes.ts**: TypeScript types for wallet integration.
- **walletUtils.ts**: Utility functions for wallet operations.

##### /src/integrations/supabase
Supabase database integration for storing game data.

- **client.ts**: Supabase client configuration.
- **types.ts**: TypeScript types for Supabase data.

#### /src/pages
Page components that represent different routes in the application.

- **GamePage.tsx**: The main chess game page where users play matches.
- **Index.tsx**: Homepage with options to create or join games.
- **NotFound.tsx**: 404 page for invalid routes.
- **SmartContractConfig.tsx**: Page for configuring smart contract settings.

#### /src/utils
Utility functions and types used throughout the application.

- **chessTypes.ts**: TypeScript types for chess game data models.
- **chessUtils.ts**: Utility functions for chess game logic.
- **supabaseClient.ts**: Functions for interacting with the Supabase database.

#### /src/hooks
Custom React hooks for shared functionality.

- **use-mobile.tsx**: Hook for detecting mobile devices.
- **use-toast.ts**: Hook for displaying toast notifications.

#### /src/features
Redux slices for state management.

- **walletSlice.ts**: Redux slice for wallet state management.

#### /src/store
Redux store configuration.

- **store.ts**: Main Redux store setup.

#### /src/lib
General library functions.

- **utils.ts**: General utility functions.

### /public
Static assets like images and sounds.

- **/images/pieces/**: SVG images for chess pieces.
- **/sounds/**: Sound effects for chess moves, captures, and checks.

## Key Technologies

- **React**: UI framework for building the application
- **TypeScript**: For type-safe code
- **Solana Web3.js**: For blockchain interaction
- **Supabase**: Database and backend services
- **Tailwind CSS**: For styling
- **shadcn/ui**: UI component library
- **Redux**: For state management
- **React Router**: For navigation

## Flow of the Application

1. **User Connects Wallet**:
   - Users connect their Solana wallet through the Header component
   - This establishes their identity for game creation and stakes

2. **Create Game**:
   - User clicks "Create Game" on the homepage
   - NewGameModal opens to set time control and stake amount
   - StakeConfirmationModal confirms the stake transaction
   - User signs transaction with their wallet
   - Game is created and user waits for an opponent

3. **Join Game**:
   - User clicks "Join Game" on the homepage
   - JoinGameModal shows available games
   - User selects a game to join
   - JoinStakeConfirmationModal confirms the stake
   - User signs transaction with their wallet
   - Both players are directed to the game page

4. **Game Play**:
   - Both players see a countdown before the game starts
   - White player makes the first move
   - Players take turns making moves on the ChessBoard
   - GameInfo shows time remaining and captured pieces
   - Players can flip the board using GameBoardFlip

5. **Game Conclusion**:
   - Game ends by checkmate, time out, or resignation
   - VictoryModal shows the winner
   - Stakes are transferred to the winner
   - Players can return to homepage to play again

## Database Structure

The Supabase database stores:
- Game records with time controls and stakes
- Player identities (wallet addresses)
- Game states and move history
- Results and timestamps

## Smart Contract Integration

The Solana smart contract handles:
- Stake escrow during games
- Verification of game outcomes
- Distribution of winnings to the victor
- Timestamp validation for time controls
