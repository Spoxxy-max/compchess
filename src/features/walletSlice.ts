import { createSlice} from "@reduxjs/toolkit";

const walletSlice = createSlice({
  name: "wallet",
  initialState: { connected: false, publicKey: null },
  reducers: {
    connect: (state, action) => {
      state.connected = true;
      state.publicKey = action.payload;
    },
    disconnect: (state) => {
      state.connected = false;
      state.publicKey = null;
    },
  },
});

export const { connect, disconnect } = walletSlice.actions;


export default walletSlice;