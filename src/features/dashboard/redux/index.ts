// dashboard/redux/index.ts
import { createSlice } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import { dashboardApi } from '../api';
import type { DashboardStats } from '../types/types';

interface DashboardState {
  stats: DashboardStats;
}

const initialState: DashboardState = {
  stats: {
    totalBundles: 124,
    updatedThisWeek: 12,
    totalDocuments: 1450,
    storageUsedGb: 3.2,
    storageLimitGb: 10,
  },
};

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    // Reducers for updating stats if needed
  },
  extraReducers: builder => {
    builder.addMatcher(
      dashboardApi.endpoints.getStats.matchFulfilled,
      (state, action) => {
        state.stats = action.payload;
      }
    );
  },
});

export const selectDashboardStats = (state: RootState) => state.dashboard.stats;

export default dashboardSlice.reducer;
