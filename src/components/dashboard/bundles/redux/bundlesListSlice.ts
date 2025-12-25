import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Bundle } from '../types/types';
import axiosInstance from '@/api/axiosInstance';
import camelcaseKeys from 'camelcase-keys';

type bundlesListState = {
  bundles: Bundle[];
  isLoading: boolean;
  error: string | null;
  currentBundle: Bundle | null;
};

/*
// Mock data for bundles
const mockBundles: Bundle[] = [
  {
    id: 'bundle-1',
    name: 'Smith v. Johnson - Discovery',
    caseNumber: 'CV-2024-001234',
    documentCount: 45,
    lastModified: '2025-12-15',
    status: 'In Progress',
    color: 'blue',
  },
  {
    id: 'bundle-2',
    name: 'Estate Planning - Williams',
    caseNumber: 'PR-2024-005678',
    documentCount: 23,
    lastModified: '2025-12-14',
    status: 'Complete',
    color: 'green',
  },
  {
    id: 'bundle-3',
    name: 'Corporate Merger - TechCo',
    caseNumber: 'CM-2024-009876',
    documentCount: 128,
    lastModified: '2025-12-13',
    status: 'In Progress',
    color: 'purple',
  },
  {
    id: 'bundle-4',
    name: 'Patent Infringement - ABC Inc',
    caseNumber: 'IP-2024-004321',
    documentCount: 67,
    lastModified: '2025-12-12',
    status: 'Review',
    color: 'orange',
  },
  {
    id: 'bundle-5',
    name: 'Employment Dispute - Davis',
    caseNumber: 'EM-2024-007890',
    documentCount: 34,
    lastModified: '2025-12-10',
    status: 'Complete',
    color: 'green',
  },
  {
    id: 'bundle-6',
    name: 'Real Estate Transaction',
    caseNumber: 'RE-2024-002468',
    documentCount: 19,
    lastModified: '2025-12-08',
    status: 'In Progress',
    color: 'blue',
  },
];
*/

const initialState: bundlesListState = {
  bundles: [],
  isLoading: false,
  error: null,
  currentBundle: null,
};

// Async thunk to fetch bundles from API
export const fetchBundles = createAsyncThunk(
  'bundles/fetchBundles',
  async () => {
    const response = await axiosInstance.get('/api/bundles');
    return camelcaseKeys(response.data.data, { deep: true });
  }
);

// Async thunk to fetch a single bundle by ID
export const fetchBundleById = createAsyncThunk(
  'bundles/fetchBundleById',
  async (bundleId: string) => {
    const response = await axiosInstance.get(`/api/bundles/${bundleId}`);
    return camelcaseKeys(response.data.bundle, { deep: true }) as Bundle;
  }
);

// Async thunk to create a new bundle

export const createBundleAsync = createAsyncThunk(
  'bundles/createBundle',
  async (bundleData: Partial<Bundle>) => {
    const response = await axiosInstance.post('/api/bundles', bundleData);
    return camelcaseKeys(response.data.bundle, { deep: true }) as Bundle;
  }
);

// Async thunk to delete a bundle by ID (not implemented in slice yet)
export const deleteBundleAsync = createAsyncThunk(
  'bundles/deleteBundle',
  async (bundleId: string | number) => {
    await axiosInstance.delete(`/api/bundles/${bundleId}`);
    return bundleId;
  }
);

const bundleListSlice = createSlice({
  name: 'bundleListSlice',
  initialState,
  reducers: {
    createBundle: (state, action) => {
      const newBundle: Bundle = action.payload;

      state.bundles.unshift(newBundle);
    },
    createDuplicate: (state, action) => {
      const bundleId = action.payload.id;
      const originalBundle = state.bundles.find(
        bundle => bundle.id === bundleId
      );
      if (originalBundle) {
        const duplicatedBundle: Bundle = {
          ...originalBundle,
          id: crypto.randomUUID(),
          name: `${originalBundle.name} (Copy)`,
          lastModified: new Date().toISOString().split('T')[0],
          status: 'In Progress',
          documentCount: 0, // or keep original count: originalBundle.documentCount
        };

        // Find the index of the original bundle
        const originalIndex = state.bundles.findIndex(
          bundle => bundle.id === action.payload
        );

        // Insert the duplicate right after the original
        state.bundles.splice(originalIndex + 1, 0, duplicatedBundle);
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchBundles.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBundles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bundles = action.payload;
        state.error = null;
      })
      .addCase(fetchBundles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch bundles';
      });
    builder
      .addCase(fetchBundleById.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBundleById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBundle = action.payload;
        state.error = null;
      })
      .addCase(fetchBundleById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch bundle';
      });
    builder
      .addCase(createBundleAsync.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBundleAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bundles.unshift(action.payload);
        state.error = null;
      })
      .addCase(createBundleAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create bundle';
      });
    builder
      .addCase(deleteBundleAsync.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteBundleAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bundles = state.bundles.filter(
          bundle => bundle.id !== action.payload
        );
        state.error = null;
      })
      .addCase(deleteBundleAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to delete bundle';
      });
  },
});

export const { createBundle, createDuplicate } = bundleListSlice.actions;
export default bundleListSlice.reducer;
