
import React, { useState } from 'react';
import { Copy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';

interface GameCodeDisplayProps {
  gameCode: string;
  shareableLink: string;
  onCopyCode: () => void;
  onCopyLink: () => void;
}

const GameCodeDisplay: React.FC<GameCodeDisplayProps> = ({
  gameCode,
  shareableLink,
  onCopyCode,
  onCopyLink
}) => {
  const { toast } = useToast();
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameCode);
    toast({
      title: "Code Copied",
      description: "Game code copied to clipboard"
    });
    onCopyCode();
  };
  
  return (
    <div className="bg-card/80 p-6 rounded-md border-2 border-solana text-center w-full">
      <h3 className="text-xl font-bold mb-2">Your Game Code</h3>
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
  );
};

export default GameCodeDisplay;
