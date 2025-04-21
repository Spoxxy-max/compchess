# CompChess

Play and Earn on CompChess - A chess platform built on Solana blockchain where players can compete and stake SOL.

## Features

-   Play chess with various time controls (Blitz, Rapid, Classical)
-   Stake SOL on games and compete for winnings
-   Secure and transparent gameplay with Solana blockchain
-   Real-time game updates and move validation
-   Share games with friends via links or game codes

## Getting Started

### Prerequisites

-   Node.js (v16 or higher)
-   Yarn or npm
-   A Solana wallet (Phantom, Solflare, etc.)

### Installation

1. Clone the repository

    ```bash
    git clone https://github.com/yourusername/compchess.git
    cd compchess
    ```

2. Install dependencies

    ```bash
    yarn install
    # or
    npm install
    ```

3. Set up environment variables

    ```bash
    cp .env.example .env
    ```

    Then edit the `.env` file and add your Supabase credentials.

4. Start the development server
    ```bash
    yarn dev
    # or
    npm run dev
    ```

## Environment Variables

The following environment variables are required:

-   `VITE_SUPABASE_URL`: Your Supabase project URL
-   `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Tech Stack

-   React with TypeScript
-   Vite for fast development
-   Supabase for database and real-time updates
-   Solana Web3.js for blockchain integration
-   TailwindCSS for styling
