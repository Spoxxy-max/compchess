
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface JoinStakeInfoDisplayProps {
  timeControl: string;
  stake: number;
  error: string | null;
  alreadyJoined: boolean;
  gameExists: boolean;
  retryAttempts: number;
  onRefreshGameStatus: () => void;
  isMobileDevice: boolean;
}

const JoinStakeInfoDisplay: React.FC<JoinStakeInfoDisplayProps> = ({
  timeControl,
  stake,
  error,
  alreadyJoined,
  gameExists,
  retryAttempts,
  onRefreshGameStatus,
  isMobileDevice
}) => {
  return (
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
      
      {isMobileDevice && retryAttempts > 0 && (
        <div className="mt-2 bg-yellow-500/20 border border-yellow-500/30 p-3 rounded-md">
          <p className="text-sm text-yellow-200">
            On mobile devices, sometimes it takes a few attempts to connect properly. 
            Please make sure your wallet is connected and try again.
          </p>
          <Button 
            className="mt-2 w-full bg-yellow-600/50 hover:bg-yellow-600" 
            onClick={onRefreshGameStatus}
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
  );
};

export default JoinStakeInfoDisplay;
