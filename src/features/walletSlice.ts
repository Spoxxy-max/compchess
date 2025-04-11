
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface WalletState {
  connected: boolean;
  publicKey: string | null;
  isMobileDevice: boolean;
  detectedWallets: string[];
}

const initialState: WalletState = {
  connected: false,
  publicKey: null,
  isMobileDevice: false,
  detectedWallets: []
};

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    connect: (state, action: PayloadAction<string>) => {
      state.connected = true;
      state.publicKey = action.payload;
    },
    disconnect: (state) => {
      state.connected = false;
      state.publicKey = null;
    },
    setMobileDevice: (state, action: PayloadAction<boolean>) => {
      state.isMobileDevice = action.payload;
    },
    setDetectedWallets: (state, action: PayloadAction<string[]>) => {
      state.detectedWallets = action.payload;
    }
  },
});

export const { connect, disconnect, setMobileDevice, setDetectedWallets } = walletSlice.actions;

export default walletSlice;
