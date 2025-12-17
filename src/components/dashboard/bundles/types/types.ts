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
  id: string;
  name: string;
  caseNumber: string;
  documentCount: number;
  lastModified: string; // ISO date string or formatted date
  status: BundleStatus;
  color: BundleColor;
  createdAt?: string;
  createdBy?: string;
  updatedBy?: string;
  description?: string;
  tags?: string[];
}

/**
 * Filter State Interface
 */
export interface FilterState {
  searchTerm: string;
  sortBy: SortOption;
  statusFilter?: BundleStatus[];
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Component Props Types
 */

export interface BundleCardProps {
  bundle: Bundle;
  onOpen: (bundle: Bundle) => void;
  onEdit?: (bundle: Bundle) => void;
  onDelete?: (bundleId: string) => void;
  onDuplicate?: (bundle: Bundle) => void;
  onExport?: (bundle: Bundle) => void;
}

export interface BundleRowProps {
  bundle: Bundle;
  onOpen: (bundle: Bundle) => void;
  onEdit?: (bundle: Bundle) => void;
  onDelete?: (bundleId: string) => void;
  onDuplicate?: (bundle: Bundle) => void;
  onExport?: (bundle: Bundle) => void;
}

export type PartialBundle = Partial<Bundle> & Pick<Bundle, 'id'>;

/**
 * Form State Types
 */
export interface BundleFormState {
  name: string;
  caseNumber: string;
  status: BundleStatus;
  color: BundleColor;
  description: string;
  tags: string[];
  errors: {
    name?: string;
    caseNumber?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Search and Pagination Types
 */
export interface SearchParams {
  query?: string;
  status?: BundleStatus[];
  page?: number;
  pageSize?: number;
  sortBy?: SortOption;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}

/**
 * BundleList Component Props
 */
export interface BundleListProps {
  initialBundles?: Bundle[];
  onBundleClick?: (bundle: Bundle) => void;
  onBundleCreate?: () => void;
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
