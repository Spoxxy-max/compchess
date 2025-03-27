
import { createRoot } from 'react-dom/client'
import { Suspense, StrictMode } from 'react'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'
import App from './App.tsx'
import './index.css'
import { WalletAdapter } from './integrations/solana/walletTypes';
import WalletContext from './providers/WalletContex';

function ErrorFallback({ error }: FallbackProps) {
  return (
    <div className="bg-background text-white p-4 rounded-md m-4">
      <h2 className="text-xl font-bold text-red-500 mb-2">Something went wrong:</h2>
      <pre className="bg-card p-3 rounded overflow-auto max-h-[80vh] text-sm">
        {error.message}
        {'\n\n'}
        {error.stack}
      </pre>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<div className="p-4 text-white">Loading...</div>}>
       <WalletContext>
        <App />
       </WalletContext>
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
);
