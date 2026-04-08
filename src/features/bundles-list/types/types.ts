/**
 * Bundle Status Types
 */
export type BundleStatus = 'In Progress' | 'Complete' | 'Review' | 'Archived';

/**
 * Bundle Color Types for visual identification
 */
export type BundleColor =
  | 'blue'
  | 'green'
  | 'purple'
  | 'orange'
  | 'red'
  | 'yellow';

/**
 * View Mode Types
 */
export type ViewMode = 'grid' | 'list';

/**
 * Sort Options
 */
export type SortOption =
  | 'recent'
  | 'oldest'
  | 'name-asc'
  | 'name-desc'
  | 'documents';

/**
 * Main Bundle Interface
 */
export interface Bundle {
  id: string | number; // Backend uses number, frontend may use string
  name: string;
  caseNumber: string; // Frontend uses camelCase
  documentCount: number; // Frontend uses camelCase
  status: BundleStatus;
  color: BundleColor;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  description?: string;
  tags?: string[];
  userId?: number;
}

/**
 * Component Props Types
 */

export interface BundleRowProps {
  bundle: Bundle;
  onOpen: (bundle: Bundle) => void;
  onEdit?: (bundle: Bundle) => void;
  onDelete?: (bundleId: string) => void;
  onDuplicate?: (bundle: Bundle) => void;
  onExport?: (bundle: Bundle) => void;
}

/**
 * Status Color Mapping Type
 */
export type StatusColorMap = {
  [K in BundleStatus]: string;
};

/**
 * Bundle Color Classes Mapping Type
 */
export type ColorClassMap = {
  [K in BundleColor]: string;
};
