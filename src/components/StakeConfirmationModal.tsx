import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, Loader2, Copy, Share2 } from "lucide-react";
import { useWallet } from '@solana/wallet-adapter-react';
import { createStakingTransaction } from '@/integrations/solana/smartContract';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TimeControl } from '@/utils/chessTypes';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [gameId, setGameId] = useState<string | null>(null);
  const [shareableLink, setShareableLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const { publicKey, signTransaction } = useWallet();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false);
    } else {
      setHasProcessed(false);
      setGameCode(null);
      setGameId(null);
      setShareableLink('');
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (gameCode) {
      const baseUrl = window.location.origin;
      setShareableLink(`${baseUrl}?code=${gameCode}`);
    }
  }, [gameCode]);

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

  const handleCopyCode = () => {
    if (gameCode) {
      navigator.clipboard.writeText(gameCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Code Copied",
        description: "Game code copied to clipboard"
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Link Copied",
      description: "Game invitation link copied to clipboard"
    });
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

    if (isProcessing || hasProcessed) return;

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
          time_control: timeControl,
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
        setGameCode(gameData.game_code || gameCode);
        setGameId(gameData.id);
      }
      
      toast({
        title: "Stake Successful",
        description: `Successfully staked ${formatStakeAmount(stake)} SOL`,
      });
      
      setHasProcessed(true);
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
    }
  };

  const handleContinueToGame = () => {
    onClose();
    setTimeout(() => {
      onConfirm();
    }, 100);
  };

  const GameSubscription = ({ gameId }: { gameId: string }) => {
    const [opponentJoined, setOpponentJoined] = useState(false);
    
    useEffect(() => {
      const subscription = supabase
        .channel(`game-${gameId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chess_games',
            filter: `id=eq.${gameId}`
          },
          (payload) => {
            console.log("Game update received:", payload);
            
            if (payload.new && payload.new.opponent_id && !opponentJoined) {
              setOpponentJoined(true);
              
              toast({
                title: "Opponent Joined",
                description: "Your opponent has joined the game! Starting soon...",
              });
              
              handleContinueToGame();
            }
          }
        )
        .subscribe();
      
      return () => {
        subscription.unsubscribe();
      };
    }, [gameId]);
    
    return null;
  };

  return (
    <Dialog 
      open={isOpen && !hasProcessed} 
      onOpenChange={(open) => {
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
              {gameId && <GameSubscription gameId={gameId} />}
              
              <div className="flex items-center justify-center py-6">
                <div className="bg-card/80 p-6 rounded-md border-2 border-solana text-center w-full">
                  <h3 className="text-xl font-bold mb-2">Game Code</h3>
                  <div className="flex items-center justify-center space-x-2">
                    <p className="text-3xl font-mono tracking-wider text-solana">{gameCode}</p>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleCopyCode}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-3 text-sm text-gray-300">
                    Share this code with your opponent to join the game
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="share-link" className="text-sm">Share invitation link</Label>
                <div className="flex space-x-2">
                  <Input
                    id="share-link"
                    value={shareableLink}
                    readOnly
                    className="bg-card/50"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="bg-solana/10 border border-solana/30 rounded-md p-4 text-sm">
                <div className="flex items-start space-x-2">
                  <div>
                    <Share2 className="h-4 w-4 mt-0.5 text-solana" />
                  </div>
                  <div>
                    <p className="font-medium text-solana mb-1">Waiting for opponent</p>
                    <p className="text-gray-300">
                      You'll automatically be taken to the game once your opponent joins. 
                      Stay on this page or copy the code to share it later.
                    </p>
                  </div>
                </div>
              </div>
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
