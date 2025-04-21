
import React from 'react';
import { Share2 } from 'lucide-react';

const WaitingForOpponent: React.FC = () => {
  return (
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
  );
};

export default WaitingForOpponent;
