import { createSlice } from '@reduxjs/toolkit';
import type { Bundle } from '../types/types';

type bundlesListState = {
  bundles: Bundle[];
};

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

const initialState: bundlesListState = {
  bundles: mockBundles,
};

const bundleListSlice = createSlice({
  name: 'bundleListSlice',
  initialState,
  reducers: {
    createBundle: (state, action) => {
      const newBundle: Bundle = {
        id: crypto.randomUUID(),
        name: action.payload.name,
        caseNumber: action.payload.caseNumber,
        documentCount: 0,
        lastModified: new Date().toISOString().split('T')[0],
        status: 'In Progress',
        color: 'blue',
      };

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
    deleteBundle: (state, action) => {
      const bundleId = action.payload;
      state.bundles = state.bundles.filter(bundle => bundle.id != bundleId);
    },
  },
});

export const { createBundle, createDuplicate, deleteBundle } =
  bundleListSlice.actions;
export default bundleListSlice.reducer;
