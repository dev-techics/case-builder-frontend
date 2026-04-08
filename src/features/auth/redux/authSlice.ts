import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import type { AuthState, User } from '../types/types';
import authApi from '../api';

/*--------------------
    Initial State
---------------------*/
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
  },
  extraReducers: builder => {
    // Logout via RTK Query
    builder
      .addMatcher(authApi.endpoints.logout.matchPending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addMatcher(authApi.endpoints.logout.matchFulfilled, state => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addMatcher(authApi.endpoints.logout.matchRejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error?.message || 'Logout failed';
      });
  },
});

export const { clearError, setUser } = authSlice.actions;

// Selectors
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;

export default authSlice.reducer;
