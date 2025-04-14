
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TimeControl } from '../utils/chessTypes';
import { subscribeToGame } from '../utils/supabaseClient';
import { useWallet } from '../integrations/solana/walletContext';
import { useNavigate } from 'react-router-dom';

// Import the newly created components
import JoinStakeInfoDisplay from './modals/JoinStakeInfoDisplay';
import MobileWalletOptions from './wallet/MobileWalletOptions';
import JoinGameDialogFooter from './modals/JoinGameDialogFooter';
import { useGameJoin } from '../hooks/useGameJoin';

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
  const navigate = useNavigate();
  const { wallet, isMobileDevice, mobileWalletDetected, detectedMobileWallets } = useWallet();
  
  const {
    isProcessing,
    alreadyJoined,
    error,
    gameExists,
    retryAttempts,
    walletConnecting,
    checkGameStatus,
    handleConnectWallet,
    handleConfirm,
  } = useGameJoin({ 
    gameId, 
    stake, 
    timeControlObject, 
    onClose, 
    onConfirm 
  });

  // Set up game subscription
  useEffect(() => {
    let subscription: any = null;
    
    if (isOpen && gameId) {
      subscription = subscribeToGame(gameId, (payload) => {
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
    }
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [isOpen, gameId, navigate, stake, timeControlObject]);

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
          <JoinStakeInfoDisplay
            timeControl={timeControl}
            stake={stake}
            error={error}
            alreadyJoined={alreadyJoined}
            gameExists={gameExists}
            retryAttempts={retryAttempts}
            onRefreshGameStatus={checkGameStatus}
            isMobileDevice={isMobileDevice}
          />
          
          {isMobileDevice && !wallet?.publicKey && (
            <MobileWalletOptions
              detectedMobileWallets={detectedMobileWallets}
              onConnectWallet={handleConnectWallet}
              walletConnecting={walletConnecting}
            />
          )}
        </div>
        
        <JoinGameDialogFooter
          isProcessing={isProcessing}
          walletConnecting={walletConnecting}
          error={error}
          retryAttempts={retryAttempts}
          gameExists={gameExists}
          alreadyJoined={alreadyJoined}
          stake={stake}
          hasWallet={!!wallet?.publicKey}
          onClose={onClose}
          onConnectWallet={() => handleConnectWallet()}
          onConfirm={handleConfirm}
        />
      </DialogContent>
    </Dialog>
  );
};

export default JoinStakeConfirmationModal;
