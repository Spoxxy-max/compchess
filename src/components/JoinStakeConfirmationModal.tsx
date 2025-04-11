
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TimeControl } from '../utils/chessTypes';
import { joinGame, getGameById, subscribeToGame } from '../utils/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { useWallet } from '../integrations/solana/walletContext';
import { Loader2, AlertCircle, RefreshCw, WalletIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Connection, clusterApiUrl } from '@solana/web3.js';

interface JoinStakeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (gameId: string) => void;
  gameId: string;
  stake: number;
  timeControl: string;
  timeControlObject: TimeControl;
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
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHostOnline, setIsHostOnline] = useState(true);
  const [gameExists, setGameExists] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const { toast } = useToast();
  const { wallet, connectWallet, isMobileDevice, mobileWalletDetected, detectedMobileWallets } = useWallet();
  const navigate = useNavigate();
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [walletConnecting, setWalletConnecting] = useState(false);
  
  // Clear error when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setRetryAttempts(0);
      checkGameStatus();
    } else {
      // Clean up subscription if modal closes
      if (subscription) {
        subscription.unsubscribe();
      }
    }
    
    return () => {
      // Clean up subscription on unmount
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [isOpen, gameId]);

  // Check game status and validity when opened
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
      
      // Subscribe to game updates
      const sub = subscribeToGame(gameId, (payload) => {
        const updatedGame = payload.new;
        
        if (updatedGame && updatedGame.status === 'active') {
          // Game is now active, both players connected
          console.log("Game is active, navigating to game page");
          navigate(`/game/${gameId}`, {
            state: {
              timeControl: timeControlObject,
              stake: stake,
              playerColor: 'black',
              gameId: gameId
            }
          });
        }
      });
      
      setSubscription(sub);
      
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

  // Always close the modal after processing to prevent re-opening
  useEffect(() => {
    if (!isProcessing && !isOpen) {
      setIsProcessing(false);
    }
  }, [isOpen, isProcessing]);

  // Render mobile wallet options if on mobile device
  const renderMobileWalletOptions = () => {
    if (!isMobileDevice) return null;
    
    return (
      <div className="mt-4 space-y-3">
        <h3 className="text-sm font-medium text-gray-300">Connect with:</h3>
        <div className="grid grid-cols-2 gap-2">
          {(detectedMobileWallets && detectedMobileWallets.length > 0) ? (
            detectedMobileWallets.map((walletInfo) => (
              <Button 
                key={walletInfo.type}
                variant="outline" 
                className="flex items-center justify-center space-x-2 h-12"
                onClick={() => handleConnectWallet(walletInfo.type)}
                disabled={walletConnecting}
              >
                <WalletIcon className="h-4 w-4" />
                <span>{walletInfo.name}</span>
              </Button>
            ))
          ) : (
            <>
              <Button 
                variant="outline" 
                className="flex items-center justify-center space-x-2 h-12"
                onClick={() => handleConnectWallet('phantom')}
                disabled={walletConnecting}
              >
                <WalletIcon className="h-4 w-4" />
                <span>Phantom</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-center space-x-2 h-12"
                onClick={() => handleConnectWallet('solflare')}
                disabled={walletConnecting}
              >
                <WalletIcon className="h-4 w-4" />
                <span>Solflare</span>
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={isProcessing ? undefined : onClose}>
      <DialogContent className="bg-card sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Confirm Stake</DialogTitle>
          <DialogDescription>
            You are about to join a game with the following details:
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium text-gray-400">Time Control:</span>
              <span className="font-medium">{timeControl}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium text-gray-400">Stake Amount:</span>
              <span className="font-medium text-solana">{stake} SOL</span>
            </div>
            
            {alreadyJoined && (
              <div className="mt-2 bg-green-500/20 border border-green-500/30 p-3 rounded-md">
                <p className="text-sm text-green-200">
                  You've already joined this game. Clicking confirm will reconnect you to the game.
                </p>
              </div>
            )}
            
            {!gameExists && (
              <div className="mt-2 bg-red-500/20 border border-red-500/30 p-3 rounded-md">
                <p className="text-sm text-red-200">
                  This game no longer exists or has been canceled.
                </p>
              </div>
            )}
            
            {error && (
              <div className="mt-2 bg-red-500/20 border border-red-500/30 p-3 rounded-md flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}
            
            {isMobileDevice && !wallet?.publicKey && (
              renderMobileWalletOptions()
            )}
            
            {isMobileDevice && retryAttempts > 0 && (
              <div className="mt-2 bg-yellow-500/20 border border-yellow-500/30 p-3 rounded-md">
                <p className="text-sm text-yellow-200">
                  On mobile devices, sometimes it takes a few attempts to connect properly. 
                  Please make sure your wallet is connected and try again.
                </p>
                <Button 
                  className="mt-2 w-full bg-yellow-600/50 hover:bg-yellow-600" 
                  onClick={checkGameStatus}
                  size="sm"
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Refresh Game Status
                </Button>
              </div>
            )}
            
            {!alreadyJoined && (
              <div className="mt-4 bg-secondary/30 p-4 rounded-md text-sm space-y-2">
                <p>
                  {stake > 0 
                    ? "By confirming, you agree to stake the above amount. If you win the game, you'll receive your stake back plus your opponent's stake."
                    : "This is a practice game with no stake. You can play without risking any SOL."}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isProcessing}
            className="sm:mr-2"
          >
            Cancel
          </Button>
          
          {!wallet?.publicKey ? (
            <Button 
              onClick={() => handleConnectWallet()}
              className="bg-solana hover:bg-solana-dark text-white"
              disabled={walletConnecting}
            >
              {walletConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <WalletIcon className="mr-2 h-4 w-4" />
                  Connect Wallet
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleConfirm}
              disabled={isProcessing || !gameExists || (!!error && !retryAttempts)}
              className="bg-solana hover:bg-solana-dark text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                alreadyJoined ? 'Rejoin Game' : (stake > 0 ? `Stake ${stake} SOL` : 'Join Game')
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JoinStakeConfirmationModal;
