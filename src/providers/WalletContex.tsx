
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
  UnsafeBurnerWalletAdapter, // Keep only for development
} from "@solana/wallet-adapter-wallets";

import { clusterApiUrl } from "@solana/web3.js";
import { FC, ReactNode, useMemo } from "react";

interface WalletContextProps {
  children: ReactNode;
}

const WalletContext: FC<WalletContextProps> = ({ children }) => {
  // Explicitly set network to Devnet
  const network = WalletAdapterNetwork.Devnet;

  // Get the devnet endpoint
  const endpoint = useMemo(() => {
    const url = clusterApiUrl(network);
    console.log("Using Solana devnet endpoint:", url);
    return url;
  }, [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new UnsafeBurnerWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

const ConnectWalletButton = () => {
  const { publicKey, disconnect, connected } = useWallet();

  return (
    <div className="wallet-button-container">
      <WalletMultiButton className="wallet-connect-button">
        {connected
          ? `${publicKey?.toBase58().slice(0, 5)}...`
          : "Connect Wallet"}
      </WalletMultiButton>
    </div>
  );
};

export { ConnectWalletButton };
export default WalletContext;
