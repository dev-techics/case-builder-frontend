import { createSlice } from "@reduxjs/toolkit";

// initial state
const initialState = 0;

//
const counterSlice = createSlice({
  name: "counters",
  initialState,
  reducers: {
    increment: (_state, _action) => {
      //
    },
    decrement: (_state, _action) => {
      //
    },
  },
});

export default counterSlice.reducer;
export const { increment, decrement } = counterSlice.actions;
