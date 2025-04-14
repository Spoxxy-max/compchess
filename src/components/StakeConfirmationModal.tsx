
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { TimeControl } from '@/utils/chessTypes';

// Import refactored components
import StakeInfoDisplay from './modals/StakeInfoDisplay';
import GameCodeDisplay from './modals/GameCodeDisplay';
import ShareableLinkInput from './modals/ShareableLinkInput';
import WaitingForOpponent from './modals/WaitingForOpponent';
import GameSubscription from './modals/GameSubscription';
import { useStakeTransaction } from '@/hooks/useStakeTransaction';

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
  const [hasProcessed, setHasProcessed] = useState(false);
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [shareableLink, setShareableLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Use the stake transaction hook
  const { isProcessing, formatStakeAmount, handleConfirmStake } = useStakeTransaction({
    stake,
    timeControlObject,
    onSuccess: (code, id) => {
      setGameCode(code);
      setGameId(id);
      setHasProcessed(true);
    }
  });
  
  useEffect(() => {
    if (!isOpen) {
      setHasProcessed(false);
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Link Copied",
      description: "Game invitation link copied to clipboard"
    });
  };

  const handleContinueToGame = () => {
    onClose();
    setTimeout(() => {
      onConfirm();
    }, 100);
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
            <StakeInfoDisplay 
              timeControl={timeControl}
              stake={stake}
              formatStakeAmount={formatStakeAmount}
            />
            
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
              {gameId && <GameSubscription gameId={gameId} onOpponentJoined={handleContinueToGame} />}
              
              <div className="flex items-center justify-center py-6">
                <GameCodeDisplay 
                  gameCode={gameCode} 
                  shareableLink={shareableLink}
                  onCopyCode={() => setCopied(true)}
                  onCopyLink={handleCopyLink}
                />
              </div>
              
              <ShareableLinkInput 
                shareableLink={shareableLink}
                onCopyLink={handleCopyLink}
              />
              
              <WaitingForOpponent />
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
