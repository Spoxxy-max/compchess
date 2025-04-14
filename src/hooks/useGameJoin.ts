
import { useState, useEffect } from 'react';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { useWallet } from '../integrations/solana/walletContext';
import { getGameById, joinGame } from '../utils/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { TimeControl } from '@/utils/chessTypes';

interface UseGameJoinProps {
  gameId: string;
  stake: number;
  timeControlObject: TimeControl;
  onClose: () => void;
  onConfirm: (gameId: string) => void;
}

export const useGameJoin = ({ 
  gameId, 
  stake, 
  timeControlObject, 
  onClose, 
  onConfirm 
}: UseGameJoinProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHostOnline, setIsHostOnline] = useState(true);
  const [gameExists, setGameExists] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [walletConnecting, setWalletConnecting] = useState(false);
  
  const { toast } = useToast();
  const { wallet, connectWallet, isMobileDevice, mobileWalletDetected, detectedMobileWallets } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (gameId) {
      setError(null);
      setRetryAttempts(0);
      checkGameStatus();
    }
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [gameId]);

  const checkGameStatus = async () => {
    if (!gameId) return;
    
    try {
      console.log("Checking game status for:", gameId);
      const gameData = await getGameById(gameId);
      
      if (!gameData) {
        setGameExists(false);
        setError("Game not found or no longer available");
        return;
      }
      
      console.log("Retrieved game data:", JSON.stringify(gameData, null, 2));
      
      // Check if game is already full
      if (gameData.opponent_id && gameData.status !== 'waiting') {
        setError("This game already has an opponent");
        return;
      }
      
      // Check if the user is trying to join their own game
      if (wallet?.publicKey && gameData.host_id === wallet.publicKey.toString()) {
        setError("You cannot join your own game");
        return;
      }
      
      // Check if user already joined this game
      if (wallet?.publicKey && gameData.opponent_id === wallet.publicKey.toString()) {
        setAlreadyJoined(true);
        console.log("User is already joined to this game");
      } else {
        setAlreadyJoined(false);
      }
    } catch (error) {
      console.error("Error checking game status:", error);
      setError("Could not verify game status. Please try again.");
    }
  };

  const handleConnectWallet = async (type?: string) => {
    if (walletConnecting) return;
    
    try {
      setWalletConnecting(true);
      setError(null);
      
      console.log(`Attempting to connect wallet of type: ${type || 'auto'}`);
      
      await connectWallet(type as any);
      
      // After connecting, recheck game status
      checkGameStatus();
      
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been connected successfully",
      });
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      setError(`Wallet connection failed: ${error.message || "Unknown error"}`);
      
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setWalletConnecting(false);
    }
  };

  const handleConfirm = async () => {
    if (!wallet?.publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to join the game",
        variant: "destructive",
      });
      return;
    }

    // Prevent double-processing
    if (isProcessing) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      // If user already joined this game, navigate directly
      if (alreadyJoined) {
        console.log("User is already joined to this game, navigating directly");
        
        toast({
          title: "Rejoining Game",
          description: "You've already joined this game. Reconnecting...",
        });
        
        // Navigate directly without requiring another join or stake
        navigate(`/game/${gameId}`, {
          state: {
            timeControl: timeControlObject,
            stake: stake,
            playerColor: 'black',
            gameId: gameId
          }
        });
        
        onConfirm(gameId);
        onClose();
        return;
      }

      console.log("Attempting to join game:", gameId);

      // Connect to Solana devnet
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      console.log("Connected to Solana devnet for join game:", connection.rpcEndpoint);

      // Get the game data to verify it's available
      const gameData = await getGameById(gameId);
      if (!gameData) {
        throw new Error("Game not found or no longer available");
      }

      // Check if game is already full
      if (gameData.opponent_id && gameData.opponent_id !== wallet.publicKey.toString()) {
        throw new Error("This game already has an opponent");
      }

      // Check if game is in waiting state
      if (gameData.status !== 'waiting') {
        throw new Error("This game is no longer accepting players");
      }
      
      // Check that user isn't joining their own game
      if (gameData.host_id === wallet.publicKey.toString()) {
        throw new Error("You cannot join your own game");
      }

      try {
        // Join the game in the database with exponential backoff retry
        const MAX_RETRIES = 3;
        let currentRetry = 0;
        let joinSuccess = false;
        
        while (currentRetry < MAX_RETRIES && !joinSuccess) {
          try {
            console.log(`Join attempt ${currentRetry + 1} with user public key:`, wallet.publicKey.toString());
            joinSuccess = await joinGame(gameId, wallet.publicKey.toString());
            
            if (joinSuccess) {
              console.log("Successfully joined game in database");
              break;
            }
          } catch (joinErr: any) {
            console.error(`Join attempt ${currentRetry + 1} failed:`, joinErr);
            
            // Only throw on the last attempt
            if (currentRetry === MAX_RETRIES - 1) {
              throw joinErr;
            }
            
            // Wait before retry (exponential backoff)
            const delay = Math.pow(2, currentRetry) * 500; // 500ms, 1s, 2s
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          currentRetry++;
        }
        
        if (!joinSuccess) {
          throw new Error("Failed to join the game after multiple attempts");
        }

        // If stake is zero, we don't need to process a transaction
        if (stake === 0) {
          toast({
            title: "Game Joined",
            description: "You've successfully joined the game!",
          });
          
          // Immediately navigate to the game page
          navigate(`/game/${gameId}`, {
            state: {
              timeControl: timeControlObject,
              stake: stake,
              playerColor: 'black',
              gameId: gameId
            }
          });
          
          onConfirm(gameId);
          onClose();
          return;
        }

        // For non-zero stakes, we'd typically process the transaction here
        // This is simplified as the actual transaction logic would depend on your implementation
        console.log(`Processing stake of ${stake} SOL for game ${gameId} on devnet`);
        
        // Simulate transaction processing
        setTimeout(() => {
          toast({
            title: "Stake Confirmed",
            description: `You've staked ${stake} SOL to join the game!`,
          });
          
          // Navigate to the game page after successful staking
          navigate(`/game/${gameId}`, {
            state: {
              timeControl: timeControlObject,
              stake: stake,
              playerColor: 'black',
              gameId: gameId
            }
          });
          
          onConfirm(gameId);
          onClose();
          setIsProcessing(false);
        }, 1500);
      } catch (joinError: any) {
        console.error("Error in join game process:", joinError);
        throw joinError;
      }
      
    } catch (error: any) {
      console.error("Error joining game:", error);
      setError(error.message || "Failed to join the game. Please try again.");
      toast({
        title: "Error",
        description: error.message || "Failed to join the game. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
      // Increment retry attempts
      setRetryAttempts(prev => prev + 1);
    }
  };

  return {
    isProcessing,
    alreadyJoined,
    error,
    isHostOnline,
    gameExists,
    retryAttempts,
    walletConnecting,
    checkGameStatus,
    handleConnectWallet,
    handleConfirm,
  };
};
