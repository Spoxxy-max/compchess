
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Add polyfills for the Buffer class that Solana Web3.js requires
    'global': {},
    'process.env': {},
  },
  optimizeDeps: {
    esbuildOptions: {
      // Enable node global polyfills (this is needed for Buffer)
      define: {
        global: 'globalThis',
      },
    },
  },
}));
