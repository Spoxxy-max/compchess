
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./providers/WalletProvider";
import { Suspense } from "react";
import Index from "./pages/Index";
import GamePage from "./pages/GamePage";
import NotFound from "./pages/NotFound";
import { timeControlOptions } from "./utils/chessUtils";

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
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Suspense fallback={<LoadingFallback />}>
        <WalletProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/game" element={<GamePage timeControl={timeControlOptions[0]} stake={0} />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </WalletProvider>
      </Suspense>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
