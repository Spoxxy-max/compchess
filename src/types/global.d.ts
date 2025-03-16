
interface Window {
  phantom?: {
    solana: {
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      publicKey?: { toString: () => string };
    };
  };
  solflare?: {
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    publicKey?: { toString: () => string };
  };
  trustwallet?: {
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    publicKey?: { toString: () => string };
  };
  backpack?: {
    solana?: {
      connect: () => Promise<void>;
      disconnect: () => Promise<void>;
      publicKey?: { toString: () => string };
    };
  };
  solana?: {
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    publicKey?: PublicKey;
    isTrust?: boolean;
  };
}
