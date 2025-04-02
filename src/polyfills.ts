
// Polyfill for Buffer which is required by Solana Web3.js
import { Buffer } from 'buffer';

// Make Buffer available globally
window.Buffer = Buffer;

// Declare Buffer on the global Window interface to avoid TypeScript errors
declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}
