import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { useWallet } from '@solana/wallet-adapter-react';
import { createStakingTransaction } from '@/integrations/solana/smartContract';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TimeControl } from '@/utils/chessTypes';
import { Connection, PublicKey } from '@solana/web3.js';

interface StakeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  stake: number;
  timeControl: string;
  timeControlObject?: TimeControl;
}

const StakeConfirmationModal: React.FC<StakeConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  stake, 
  timeControl,
  timeControlObject 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [gameCode, setGameCode] = useState<string | null>(null);
  const { publicKey, signTransaction } = useWallet();
  const { toast } = useToast();
  
  // Reset processing state when dialog closes or opens
  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false);
      // Don't reset hasProcessed here so we can prevent reopening
    } else {
      // Only reset hasProcessed when the dialog is freshly opened
      setHasProcessed(false);
      setGameCode(null);
    }
  }, [isOpen]);
  
  const formatStakeAmount = (amount: number) => {
    if (amount < 0.001) {
      return amount.toFixed(6);
    }
    if (amount < 0.01) {
      return amount.toFixed(5);
    }
    if (amount < 0.1) {
      return amount.toFixed(4);
    }
    return amount.toFixed(3);
  };

  const handleConfirmStake = async () => {
    if (!publicKey || !signTransaction) {
      toast({
        title: "Wallet Error",
        description: "Please connect your wallet to stake",
        variant: "destructive"
      });
      return;
    }

    // Prevent multiple clicks or reprocessing
    if (isProcessing || hasProcessed) return;

    try {
      setIsProcessing(true);
      console.log("Starting transaction process with wallet:", publicKey.toString());
      
      // Connect to Solana devnet
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      
      // Get the time control in seconds
      const timeInSeconds = timeControlObject ? timeControlObject.startTime : 600; // Default to 10 min if not provided
      
      console.log("Creating transaction with stake:", stake, "SOL and time control:", timeInSeconds, "seconds");
      
      // Create the transaction
      const transaction = await createStakingTransaction(publicKey.toString(), stake, timeInSeconds);
      
      // Get a recent blockhash and set it on the transaction
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      console.log("Transaction created with blockhash:", blockhash);
      console.log("Signing transaction now...");
      
      // Sign the transaction
      const signedTransaction = await signTransaction(transaction);
      
      console.log("Transaction signed successfully. Sending to network...");
      
      // Send the signed transaction to the Solana network
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      console.log("Transaction sent with signature:", signature);
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        console.error("Transaction confirmed but has errors:", confirmation.value.err);
        throw new Error(`Transaction confirmed but has errors: ${JSON.stringify(confirmation.value.err)}`);
      }
      
      console.log("Transaction confirmed successfully:", confirmation);
      
      // Generate a unique game code (6 characters)
      const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Create a new game in the database
      const { data: gameData, error } = await supabase
        .from('chess_games')
        .insert({
          host_id: publicKey.toString(),
          time_control: timeControl,
          time_white: timeInSeconds,
          time_black: timeInSeconds,
          stake: stake,
          status: 'waiting',
          board_state: {}, // Using empty object that will be transformed by boardToJson
          move_history: [],
          current_turn: 'white',
          game_code: gameCode
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error creating game in database:", error);
        throw error;
      }
      
      console.log("Game created successfully in database:", gameData);
      
      // Store the game code for display
      if (gameData) {
        // Access game_code directly from gameData
        setGameCode(gameData.game_code || gameCode);
      }
      
      toast({
        title: "Stake Successful",
        description: `Successfully staked ${formatStakeAmount(stake)} SOL`,
      });
      
      // Mark as processed to prevent duplicate processing
      setHasProcessed(true);
      
      // No longer immediately close modal or navigate since we want to show the game code
      
    } catch (error: any) {
      console.error("Error processing stake:", error);
      
      // Get more detailed error information when available
      let errorMessage = error.message || "Failed to process stake transaction";
      
      // Check for specific Solana error types
      if (error.logs) {
        console.error("Transaction logs:", error.logs);
        errorMessage = `${errorMessage}. Error details: ${error.logs.join(' ')}`;
      }
      
      toast({
        title: "Stake Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  // Handle continue button click when game code is shown
  const handleContinueToGame = () => {
    // First close the modal to prevent it from showing again
    onClose();
    
    // Then after a short delay, navigate
    setTimeout(() => {
      onConfirm();
    }, 100);
  };

  return (
    <Dialog 
      open={isOpen && !hasProcessed} 
      onOpenChange={(open) => {
        // Only allow closing if we're not processing
        if (!open && !isProcessing) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {gameCode ? "Game Created" : "Confirm Stake"}
          </DialogTitle>
        </DialogHeader>
        
        {!gameCode ? (
          <>
            <div className="p-4 flex flex-col space-y-4">
              <div className="flex items-center space-x-2 text-yellow-500">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">
                  You're about to start a game with real stakes
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-card/50 p-4 rounded-md">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-400">Time Control</span>
                  <span className="font-medium">{timeControl}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-400">Stake Amount</span>
                  <span className="font-medium text-solana">{formatStakeAmount(stake)} SOL</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-300">
                By confirming, you agree to stake {formatStakeAmount(stake)} SOL on this game. This amount will be held in escrow until the game concludes.
              </p>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmStake}
                className="bg-solana hover:bg-solana-dark text-white"
                disabled={isProcessing || hasProcessed}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm Stake <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="p-4 flex flex-col space-y-4">
              <div className="flex items-center justify-center py-6">
                <div className="bg-card/80 p-6 rounded-md border-2 border-solana text-center">
                  <h3 className="text-xl font-bold mb-2">Game Code</h3>
                  <p className="text-3xl font-mono tracking-wider text-solana">{gameCode}</p>
                  <p className="mt-3 text-sm text-gray-300">
                    Share this code with your opponent to join the game
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-gray-300">
                Your opponent can join the game by entering this code in the Join Game screen.
                The game will begin once they successfully join.
              </p>
            </div>
            
            <DialogFooter>
              <Button 
                onClick={handleContinueToGame}
                className="bg-solana hover:bg-solana-dark text-white"
              >
                Continue to Game
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StakeConfirmationModal;
