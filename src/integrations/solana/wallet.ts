
// Re-export all wallet-related types and components for backward compatibility
export * from './walletTypes';
export * from './walletUtils';
export * from './walletContext';

// Re-export adapters if needed elsewhere
export * from './adapters/BaseWalletAdapter';
export * from './adapters/PhantomWalletAdapter';
export * from './adapters/SolflareWalletAdapter';
export * from './adapters/TrustWalletAdapter';
export * from './adapters/BackpackWalletAdapter';

// Re-export smart contract functionality for easier access
export * from './chessSmartContract';
