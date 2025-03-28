
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  WalletContext, 
  WalletAdapter, 
  WalletType,
  createWallet,
  getAvailableWallets
} from '../integrations/solana/wallet';
import { executeSmartContractMethod } from '../integrations/solana/smartContract';
import { useToast } from "@/hooks/use-toast";
import { initializeGameIDL, isIDLInitialized } from '../integrations/solana/chessSmartContract';

// IDL from the user input - will be initialized automatically
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

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletAdapter | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<{ type: WalletType; name: string }[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const wallets = getAvailableWallets();
    setAvailableWallets(wallets);

    // Initialize IDL by default to prevent errors
    if (!isIDLInitialized()) {
      const success = initializeGameIDL(CHESS_IDL);
      console.log("Chess Game IDL initialized during provider load:", success);
      
      // Remove the automatic toast notification for IDL loading
      // This line is removed/commented out
    }

    // Disconnect wallet on page refresh
    const disconnectOnReload = async () => {
      await disconnectWallet();
      console.log("Wallet disconnected on page refresh");
    };

    window.addEventListener("beforeunload", disconnectOnReload);

    return () => {
      window.removeEventListener("beforeunload", disconnectOnReload);
    };
  }, []);

  const connectWallet = async (type?: WalletType): Promise<WalletAdapter | void> => {
    if (connecting) return;
    
    try {
      setConnecting(true);
      console.log("Attempting to connect wallet of type:", type);
      
      const newWallet = createWallet(type);

      // Check if on mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Handle mobile wallet connection
      if (isMobile) {
        try {
          // If on mobile, we'll try to use the wallet adapter directly
          // or create a deep link to open the wallet app
          if (type === 'phantom' && !window.phantom?.solana) {
            window.location.href = `https://phantom.app/ul/browse/${window.location.href}`;
            return;
          } 
          if (type === 'solflare' && !window.solflare) {
            window.location.href = `https://solflare.com/ul/browse/${window.location.href}`;
            return;
          }
          if (type === 'trustwallet' && !(window.trustwallet || window.solana?.isTrust)) {
            window.location.href = `https://link.trustwallet.com/open_url?url=${window.location.href}`;
            return;
          }
          // For backpack and other wallets, attempt to use their deep links if available
        } catch (mobileError) {
          console.error("Mobile wallet connection error:", mobileError);
        }
      } else {
        // Desktop wallet extension checks
        if (type === 'phantom' && !window.phantom?.solana) {
          throw new Error('Phantom wallet is not installed. Please install it from https://phantom.app/');
        } 
        if (type === 'solflare' && !window.solflare) {
          throw new Error('Solflare wallet is not installed. Please install it from https://solflare.com/');
        } 
        if (type === 'trustwallet' && !(window.trustwallet || window.solana?.isTrust)) {
          throw new Error('Trust Wallet is not installed. Please install it from https://trustwallet.com/');
        } 
        if (type === 'backpack' && !window.backpack?.solana) {
          throw new Error('Backpack wallet is not installed. Please install it from https://www.backpack.app/');
        }
      }

      try {
        await newWallet.connect();
        
        console.log(`${newWallet.walletName} wallet connected:`, newWallet.publicKey);
        
        setWallet(newWallet);
        if (type) localStorage.setItem('lastWalletType', type);
        
        toast({
          title: `${newWallet.walletName} Connected`,
          description: "Successfully connected to your Solana wallet",
        });
        
        return newWallet;
      } catch (connectError: any) {
        // If connection fails due to a fetch error, try to proceed with a fake PK
        if (connectError.message === 'Failed to fetch') {
          console.warn("Balance fetch failed, but continuing with wallet connection");
          
          // Force the connection without network dependency
          newWallet.connected = true;
          if (!newWallet.publicKey) {
            // Generate a fake public key for dev purposes
            newWallet.publicKey = `dev_${Math.random().toString(36).substring(2, 10)}`;
          }
          
          // Set a mock balance for better UX in dev mode
          newWallet.balance = 100; // 100 SOL for testing
          
          setWallet(newWallet);
          if (type) localStorage.setItem('lastWalletType', type);
          
          toast({
            title: `${newWallet.walletName} Connected (Dev Mode)`,
            description: "Connected with 100 SOL for testing purposes",
          });
          
          return newWallet;
        } else {
          throw connectError;
        }
      }
    } catch (error: any) {
      console.error("Wallet connection error:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to wallet",
        variant: "destructive",
      });
      throw error;
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = async (): Promise<void> => {
    if (!wallet) return;
    
    try {
      console.log("Disconnecting wallet...");
      await wallet.disconnect();
      setWallet(null);
      localStorage.removeItem('lastWalletType');
      
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from your Solana wallet",
      });
      
      if (location.pathname !== '/') {
        navigate('/');
      }
    } catch (error: any) {
      console.error("Disconnect error:", error);
      toast({
        title: "Disconnect Failed",
        description: error.message || "Failed to disconnect wallet",
        variant: "destructive",
      });
    }
  };

  const smartContractExecute = async (method: string, params: any) => {
    if (!wallet?.connected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to interact with the smart contract",
        variant: "destructive",
      });
      return { success: false, error: "Wallet not connected" };
    }
    
    try {
      const result = await executeSmartContractMethod(method as any, params);
      
      if (result.success) {
        toast({
          title: "Transaction Successful",
          description: `Successfully executed ${method}`,
        });
      } else {
        toast({
          title: "Transaction Failed",
          description: result.error?.message || `Failed to execute ${method}`,
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error: any) {
      toast({
        title: "Transaction Error",
        description: error.message || `Error executing ${method}`,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return (
    <WalletContext.Provider 
      value={{ 
        wallet, 
        connecting, 
        availableWallets,
        connectWallet, 
        disconnectWallet,
        smartContractExecute
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
