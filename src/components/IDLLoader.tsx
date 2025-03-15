
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { initializeGameIDL, isIDLInitialized } from '../integrations/solana/chessSmartContract';
import { AlertCircle, CheckCircle, Upload } from 'lucide-react';

const IDLLoader: React.FC = () => {
  const [idlContent, setIdlContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(isIDLInitialized());
  const { toast } = useToast();

  const handleIDLLoad = () => {
    try {
      setIsLoading(true);
      // Parse the IDL JSON
      const idlJson = JSON.parse(idlContent);
      
      // Initialize the IDL in the contract
      const success = initializeGameIDL(idlJson);
      
      if (success) {
        setIsLoaded(true);
        toast({
          title: "IDL Loaded Successfully",
          description: "The chess game smart contract IDL has been loaded.",
        });
      } else {
        toast({
          title: "Failed to Load IDL",
          description: "There was an error loading the IDL. Please check the format.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error parsing IDL:", error);
      toast({
        title: "Invalid IDL Format",
        description: "The IDL could not be parsed. Please check the JSON format.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setIdlContent(text);
    } catch (error) {
      console.error("Failed to read clipboard:", error);
      toast({
        title: "Clipboard Access Failed",
        description: "Could not access clipboard content. Please paste manually.",
        variant: "destructive",
      });
    }
  };

  const clearIDL = () => {
    setIdlContent('');
    setIsLoaded(false);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Chess Game Smart Contract IDL</CardTitle>
          {isLoaded ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              Loaded
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Not Loaded
            </Badge>
          )}
        </div>
        <CardDescription>
          Paste your Solana smart contract IDL JSON below to enable on-chain staking functionality.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea
            placeholder={`Paste your IDL JSON here...\n{\n  "version": "0.1.0",\n  "name": "chess_game",\n  "instructions": [...],\n  "accounts": [...]\n}`}
            className="h-64 font-mono text-sm"
            value={idlContent}
            onChange={(e) => setIdlContent(e.target.value)}
            disabled={isLoaded}
          />
          
          {!isLoaded && (
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePaste}
                className="gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                Paste from Clipboard
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {isLoaded ? (
          <Button variant="outline" onClick={clearIDL}>
            Reset IDL
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => setIdlContent('')} disabled={!idlContent}>
              Clear
            </Button>
            <Button 
              onClick={handleIDLLoad} 
              disabled={!idlContent || isLoading}
              className="bg-solana hover:bg-solana-dark"
            >
              {isLoading ? "Loading..." : "Load IDL"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default IDLLoader;
