
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { useWallet } from '@solana/wallet-adapter-react';
import { createStakingTransaction } from '@/integrations/solana/smartContract';
import { useToast } from '@/hooks/use-toast';
import { TimeControl } from '@/utils/chessTypes';
import { Connection, PublicKey } from '@solana/web3.js';

interface JoinStakeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (gameId: string) => void;
  gameId: string;
  stake: number;
  timeControl: string;
  timeControlObject?: TimeControl;
}

const JoinStakeConfirmationModal: React.FC<JoinStakeConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  gameId,
  stake, 
  timeControl,
  timeControlObject 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { publicKey, signTransaction } = useWallet();
  const { toast } = useToast();
  
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

    try {
      setIsProcessing(true);
      console.log("Starting join transaction process with wallet:", publicKey.toString());
      console.log("Game ID for joining:", gameId);
      console.log("Stake amount:", stake, "SOL");
      
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
      
      toast({
        title: "Stake Successful",
        description: `Successfully staked ${formatStakeAmount(stake)} SOL to join the game`,
      });
      
      // Close modal immediately and redirect
      onClose();
      onConfirm(gameId);
    } catch (error: any) {
      console.error("Error processing join stake:", error);
      
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
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Confirm Join Game</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 flex flex-col space-y-4">
          <div className="flex items-center space-x-2 text-yellow-500">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">
              You're about to join a game with real stakes
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
            By confirming, you agree to stake {formatStakeAmount(stake)} SOL to join this game. This amount will be held in escrow until the game concludes.
          </p>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmStake}
            className="bg-solana hover:bg-solana-dark text-white"
            disabled={isProcessing}
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
      </DialogContent>
    </Dialog>
  );
};

export default JoinStakeConfirmationModal;
