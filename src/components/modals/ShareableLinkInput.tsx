
import React from 'react';
import { Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';

interface ShareableLinkInputProps {
  shareableLink: string;
  onCopyLink: () => void;
}

const ShareableLinkInput: React.FC<ShareableLinkInputProps> = ({
  shareableLink,
  onCopyLink
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="share-link" className="text-sm">Share invitation link</Label>
      <div className="flex space-x-2">
        <Input
          id="share-link"
          value={shareableLink}
          readOnly
          className="bg-card/50"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={onCopyLink}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ShareableLinkInput;
