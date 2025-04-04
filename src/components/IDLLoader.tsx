
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { initializeGameIDL, isIDLInitialized } from '../integrations/solana/chessSmartContract';
import { AlertCircle, CheckCircle, Download, Upload } from 'lucide-react';

const CHESS_IDL = {
  "version": "0.1.0",
  "name": "chess_game",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "programState",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "admin",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "createGame",
      "accounts": [
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "host",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "programState",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "stakeAmount",
          "type": "u64"
        },
        {
          "name": "timeControl",
          "type": "u64"
        }
      ]
    },
    {
      "name": "joinGame",
      "accounts": [
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "opponent",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "makeMove",
      "accounts": [
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "player",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "from",
          "type": "string"
        },
        {
          "name": "to",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "ChessProgramState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "gameCount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "ChessGame",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "host",
            "type": "publicKey"
          },
          {
            "name": "opponent",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "stake",
            "type": "u64"
          },
          {
            "name": "timeControl",
            "type": "u64"
          },
          {
            "name": "status",
            "type": "u8"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "lastWhiteMove",
            "type": "i64"
          },
          {
            "name": "lastBlackMove",
            "type": "i64"
          },
          {
            "name": "winner",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "endReason",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "moves",
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "GameStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Waiting"
          },
          {
            "name": "Active"
          },
          {
            "name": "Completed"
          },
          {
            "name": "Aborted"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidGameStatus"
    },
    {
      "code": 6001,
      "name": "NotPlayerTurn"
    },
    {
      "code": 6002,
      "name": "TimeoutNotReached"
    },
    {
      "code": 6003,
      "name": "NotWinner"
    },
    {
      "code": 6004,
      "name": "InactivityTimeNotReached"
    },
    {
      "code": 6005,
      "name": "InvalidMove"
    },
    {
      "code": 6006,
      "name": "InsufficientFunds"
    },
    {
      "code": 6007,
      "name": "InvalidReason"
    }
  ]
};

const IDLLoader: React.FC = () => {
  const [idlContent, setIdlContent] = useState(JSON.stringify(CHESS_IDL, null, 2));
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(isIDLInitialized());
  const { toast } = useToast();

  // Auto-load IDL on component mount if not already loaded
  useEffect(() => {
    if (!isLoaded) {
      handleIDLLoadSilently();
    }
  }, []);

  // Silent version that doesn't show a toast
  const handleIDLLoadSilently = () => {
    try {
      setIsLoading(true);
      
      const success = initializeGameIDL(CHESS_IDL);
      
      if (success) {
        setIsLoaded(true);
        console.log("IDL loaded silently");
      } else {
        console.error("Failed to load IDL silently");
      }
    } catch (error) {
      console.error("Error parsing IDL:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // User-initiated IDL load that shows a toast
  const handleIDLLoad = () => {
    try {
      setIsLoading(true);
      
      const success = initializeGameIDL(CHESS_IDL);
      
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
      toast({
        title: "Content Pasted",
        description: "Clipboard content pasted successfully.",
      });
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
    toast({
      title: "IDL Reset",
      description: "The IDL has been reset. You can load a new one.",
    });
  };

  const handleUseExample = () => {
    const exampleIDL = {
      "version": "0.1.0",
      "name": "chess_game",
      "instructions": [
        {
          "name": "initialize",
          "accounts": [
            {
              "name": "admin",
              "isMut": true,
              "isSigner": true
            },
            {
              "name": "programState",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "systemProgram",
              "isMut": false,
              "isSigner": false
            }
          ],
          "args": []
        },
        {
          "name": "createGame",
          "accounts": [
            {
              "name": "player",
              "isMut": true,
              "isSigner": true
            },
            {
              "name": "game",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "playerTokenAccount",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "gameTokenAccount",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "tokenProgram",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "systemProgram",
              "isMut": false,
              "isSigner": false
            }
          ],
          "args": [
            {
              "name": "stakeAmount",
              "type": "u64"
            },
            {
              "name": "timeControl",
              "type": "u64"
            }
          ]
        },
        {
          "name": "joinGame",
          "accounts": [
            {
              "name": "player",
              "isMut": true,
              "isSigner": true
            },
            {
              "name": "game",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "playerTokenAccount",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "gameTokenAccount",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "tokenProgram",
              "isMut": false,
              "isSigner": false
            }
          ],
          "args": []
        }
      ],
      "accounts": [
        {
          "name": "ChessProgramState",
          "type": {
            "kind": "struct",
            "fields": [
              {
                "name": "admin",
                "type": "publicKey"
              },
              {
                "name": "gameCount",
                "type": "u64"
              }
            ]
          }
        },
        {
          "name": "ChessGame",
          "type": {
            "kind": "struct",
            "fields": [
              {
                "name": "host",
                "type": "publicKey"
              },
              {
                "name": "opponent",
                "type": {
                  "option": "publicKey"
                }
              },
              {
                "name": "stake",
                "type": "u64"
              },
              {
                "name": "timeControl",
                "type": "u64"
              },
              {
                "name": "status",
                "type": "u8"
              },
              {
                "name": "createdAt",
                "type": "i64"
              },
              {
                "name": "lastWhiteMove",
                "type": "i64"
              },
              {
                "name": "lastBlackMove",
                "type": "i64"
              },
              {
                "name": "winner",
                "type": {
                  "option": "publicKey"
                }
              },
              {
                "name": "endReason",
                "type": {
                  "option": "string"
                }
              },
              {
                "name": "moves",
                "type": {
                  "vec": "string"
                }
              },
              {
                "name": "bump",
                "type": "u8"
              }
            ]
          }
        }
      ],
      "errors": [
        {
          "code": 6000,
          "name": "InvalidGameStatus",
          "msg": "Invalid game status for this operation"
        },
        {
          "code": 6001,
          "name": "NotPlayerTurn",
          "msg": "Not player's turn"
        },
        {
          "code": 6002,
          "name": "TimeoutNotReached",
          "msg": "Timeout condition not met"
        },
        {
          "code": 6003,
          "name": "NotWinner",
          "msg": "Player is not the winner"
        },
        {
          "code": 6004,
          "name": "InactivityTimeNotReached",
          "msg": "Inactivity time not reached"
        }
      ]
    };
    
    setIdlContent(JSON.stringify(exampleIDL, null, 2));
    toast({
      title: "Example IDL Loaded",
      description: "An example IDL has been loaded. You can now click 'Load IDL'.",
    });
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-xl sm:text-2xl">Chess Game Smart Contract IDL</CardTitle>
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
        <CardDescription className="text-sm sm:text-base">
          {isLoaded ? 
            "The Solana smart contract IDL has been loaded. Your chess game can now interact with the blockchain." :
            "Paste your Solana smart contract IDL JSON below to enable on-chain staking functionality."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea
            placeholder={`Paste your IDL JSON here...\n{\n  "version": "0.1.0",\n  "name": "chess_game",\n  "instructions": [...],\n  "accounts": [...]\n}`}
            className="h-64 font-mono text-sm resize-none"
            value={idlContent}
            onChange={(e) => setIdlContent(e.target.value)}
            disabled={isLoaded}
          />
          
          {!isLoaded && (
            <div className="flex flex-wrap justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleUseExample}
                className="gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Use Example
              </Button>
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
      <CardFooter className="flex flex-wrap justify-end space-x-0 space-y-2 sm:space-x-2 sm:space-y-0">
        {isLoaded ? (
          <Button variant="outline" onClick={clearIDL} className="w-full sm:w-auto">
            Reset IDL
          </Button>
        ) : (
          <>
            <Button 
              variant="outline" 
              onClick={() => setIdlContent('')} 
              disabled={!idlContent || isLoading}
              className="w-full sm:w-auto mb-2 sm:mb-0"
            >
              Clear
            </Button>
            <Button 
              onClick={handleIDLLoad} 
              disabled={!idlContent || isLoading}
              className="bg-solana hover:bg-solana-dark w-full sm:w-auto"
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
