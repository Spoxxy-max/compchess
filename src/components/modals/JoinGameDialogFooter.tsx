
import React from 'react';
import { Loader2, WalletIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

interface JoinGameDialogFooterProps {
  isProcessing: boolean;
  walletConnecting: boolean;
  error: string | null;
  retryAttempts: number;
  gameExists: boolean;
  alreadyJoined: boolean;
  stake: number;
  hasWallet: boolean;
  onClose: () => void;
  onConnectWallet: () => void;
  onConfirm: () => void;
}

const JoinGameDialogFooter: React.FC<JoinGameDialogFooterProps> = ({
  isProcessing,
  walletConnecting,
  error,
  retryAttempts,
  gameExists,
  alreadyJoined,
  stake,
  hasWallet,
  onClose,
  onConnectWallet,
  onConfirm
}) => {
  return (
    <DialogFooter className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between">
      <Button 
        variant="outline" 
        onClick={onClose}
        disabled={isProcessing}
        className="sm:mr-2"
      >
        Cancel
      </Button>
      
      {!hasWallet ? (
        <Button 
          onClick={onConnectWallet}
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
          onClick={onConfirm}
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
  );
};

export default JoinGameDialogFooter;
