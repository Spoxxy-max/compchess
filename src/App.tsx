
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import Index from "./pages/Index";
import GamePage from "./pages/GamePage";
import NotFound from "./pages/NotFound";
import SmartContractConfig from './pages/SmartContractConfig';
import { timeControlOptions } from "./utils/chessUtils";
import {Provider as ReduxProvider} from "react-redux"
import { store } from "./store/store";
import '@solana/wallet-adapter-react-ui/styles.css';
import { WalletContext } from './integrations/solana/walletContext';

// Create a QueryClient for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const LoadingFallback = () => (
  <div className="h-screen w-full flex items-center justify-center bg-background">
    <div className="animate-pulse text-white text-lg">Loading...</div>
  </div>
);

const App = () => (
  <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TooltipProvider>
            <Suspense fallback={<LoadingFallback />}>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route
                  path="/game"
                  element={
                    <GamePage timeControl={timeControlOptions[0]} stake={0} />
                  }
                />
                <Route
                  path="/game/:id"
                  element={
                    <GamePage timeControl={timeControlOptions[0]} stake={0} />
                  }
                />
                <Route
                  path="/smart-contract"
                  element={<SmartContractConfig />}
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
              {/* </WalletProvider> */}
            </Suspense>
          </TooltipProvider>
        </BrowserRouter>
      </QueryClientProvider>
  </ReduxProvider>
);

export default App;
