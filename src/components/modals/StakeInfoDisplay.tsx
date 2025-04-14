
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface StakeInfoDisplayProps {
  timeControl: string;
  stake: number;
  formatStakeAmount: (amount: number) => string;
}

const StakeInfoDisplay: React.FC<StakeInfoDisplayProps> = ({
  timeControl,
  stake,
  formatStakeAmount
}) => {
  return (
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
  );
};

export default StakeInfoDisplay;
