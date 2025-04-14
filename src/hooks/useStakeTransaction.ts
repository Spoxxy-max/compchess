
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { createStakingTransaction } from '@/integrations/solana/smartContract';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TimeControl } from '@/utils/chessTypes';

interface UseStakeTransactionProps {
  stake: number;
  timeControlObject?: TimeControl;
  onSuccess: (gameCode: string, gameId: string) => void;
}

export const useStakeTransaction = ({ 
  stake, 
  timeControlObject, 
  onSuccess 
}: UseStakeTransactionProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { publicKey, signTransaction } = useWallet();
  const { toast } = useToast();

  const formatStakeAmount = (amount: number) => {
    if (amount < 0.001) return amount.toFixed(6);
    if (amount < 0.01) return amount.toFixed(5);
    if (amount < 0.1) return amount.toFixed(4);
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

    if (isProcessing) return;

    try {
      setIsProcessing(true);
      console.log("Starting transaction process with wallet:", publicKey.toString());
      
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      console.log("Connected to Solana devnet for transaction:", connection.rpcEndpoint);
      
      const timeInSeconds = timeControlObject ? timeControlObject.startTime : 600;
      
      console.log("Creating transaction with stake:", stake, "SOL and time control:", timeInSeconds, "seconds");
      
      const transaction = await createStakingTransaction(publicKey.toString(), stake, timeInSeconds);
      
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      console.log("Transaction created with blockhash:", blockhash);
      console.log("Signing transaction now...");
      
      const signedTransaction = await signTransaction(transaction);
      
      console.log("Transaction signed successfully. Sending to network...");
      
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      console.log("Transaction sent with signature:", signature);
      
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        console.error("Transaction confirmed but has errors:", confirmation.value.err);
        throw new Error(`Transaction confirmed but has errors: ${JSON.stringify(confirmation.value.err)}`);
      }
      
      console.log("Transaction confirmed successfully:", confirmation);
      
      const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data: gameData, error } = await supabase
        .from('chess_games')
        .insert({
          host_id: publicKey.toString(),
          time_control: timeControlObject ? timeControlObject.type : '10+0',
          time_white: timeInSeconds,
          time_black: timeInSeconds,
          stake: stake,
          status: 'waiting',
          board_state: {},
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
      
      if (gameData) {
        toast({
          title: "Stake Successful",
          description: `Successfully staked ${formatStakeAmount(stake)} SOL`,
        });
        
        onSuccess(gameData.game_code || gameCode, gameData.id);
      }
    } catch (error: any) {
      console.error("Error processing stake:", error);
      
      let errorMessage = error.message || "Failed to process stake transaction";
      
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
      return false;
    } finally {
      setIsProcessing(false);
    }
    
    return true;
  };

  return {
    isProcessing,
    formatStakeAmount,
    handleConfirmStake
  };
};
