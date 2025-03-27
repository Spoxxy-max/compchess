import walletSlice from "@/features/walletSlice";
import { configureStore } from "@reduxjs/toolkit";

export const store = configureStore({
  reducer: {
    wallet: walletSlice.reducer,
  },
});
