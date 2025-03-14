
interface Window {
  phantom?: {
    solana: {
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
    };
  };
  solflare?: {
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    publicKey?: { toString: () => string };
  };
}
