import React, { useState } from 'react';
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
      console.log("Starting transaction process with wallet:", publicKey.toString());
      
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      
      const timeInSeconds = timeControlObject ? timeControlObject.startTime : 600; // Default to 10 min if not provided
      const transaction = await createStakingTransaction(publicKey.toString(), stake, timeInSeconds);
      
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      console.log("Transaction created, signing now...");
      
      const signedTransaction = await signTransaction(transaction);
      
      console.log("Transaction signed, sending to network...");
      
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      console.log("Transaction sent with signature:", signature);
      
      await connection.confirmTransaction(signature, 'confirmed');
      
      console.log("Transaction confirmed with signature:", signature);
      
      const { data: gameData, error } = await supabase
        .from('chess_games')
        .insert({
          host_id: publicKey.toString(),
          time_control: timeControl,
          time_white: timeInSeconds,
          time_black: timeInSeconds,
          stake: stake,
          status: 'waiting',
          board_state: {
            pieces: [],
            currentTurn: 'white',
            whiteTime: timeInSeconds,
            blackTime: timeInSeconds,
            moveHistory: []
          },
          move_history: [],
          current_turn: 'white'
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Stake Successful",
        description: `Successfully staked ${formatStakeAmount(stake)} SOL`,
      });
      
      onConfirm();
    } catch (error: any) {
      console.error("Error processing stake:", error);
      toast({
        title: "Stake Failed",
        description: error.message || "Failed to process stake transaction",
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
          <DialogTitle className="text-xl font-bold">Confirm Stake</DialogTitle>
        </DialogHeader>
        
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

export default StakeConfirmationModal;
