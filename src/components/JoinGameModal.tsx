
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GameData } from '@/utils/supabaseClient';

export interface JoinGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameData | null;
  onConfirm: (game: GameData) => void;
}

const JoinGameModal: React.FC<JoinGameModalProps> = ({ isOpen, onClose, game, onConfirm }) => {
  if (!game) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join Game</DialogTitle>
          <DialogDescription>
            Are you sure you want to join this game? You will need to stake {game.stake} SOL.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Game ID:</p>
              <p className="text-sm text-muted-foreground">{game.id.substring(0, 8)}...</p>
            </div>
            <div>
              <p className="text-sm font-medium">Host:</p>
              <p className="text-sm text-muted-foreground">{game.host_id.substring(0, 8)}...</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Stake:</p>
              <p className="text-sm text-muted-foreground">{game.stake} SOL</p>
            </div>
            <div>
              <p className="text-sm font-medium">Time Control:</p>
              <p className="text-sm text-muted-foreground">{game.time_control}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(game)}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JoinGameModal;
