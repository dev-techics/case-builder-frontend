// types/bundle.types.ts

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
 * Document Interface (for bundle contents)
 */
export interface Document {
  id: string;
  bundleId: string;
  name: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
  pageCount?: number;
  annotations?: Annotation[];
  order: number;
}

/**
 * Annotation Interface (for document markup)
 */
export interface Annotation {
  id: string;
  documentId: string;
  type: 'highlight' | 'note' | 'comment' | 'redaction';
  content: string;
  pageNumber: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  createdAt: string;
  createdBy: string;
  color?: string;
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
export interface BundlesHeaderProps {
  onCreateNew: () => void;
}

export interface BundlesFilterBarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: SortOption;
  setSortBy: (option: SortOption) => void;
}

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

/**
 * API Response Types
 */
export interface BundleListResponse {
  bundles: Bundle[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BundleDetailResponse {
  bundle: Bundle;
  documents: Document[];
}

export interface CreateBundleRequest {
  name: string;
  caseNumber: string;
  status?: BundleStatus;
  color?: BundleColor;
  description?: string;
  tags?: string[];
}

export interface UpdateBundleRequest {
  name?: string;
  caseNumber?: string;
  status?: BundleStatus;
  color?: BundleColor;
  description?: string;
  tags?: string[];
}

/**
 * Action Types for Bundle Operations
 */
export type BundleAction =
  | { type: 'OPEN'; payload: Bundle }
  | { type: 'EDIT'; payload: Bundle }
  | { type: 'DELETE'; payload: string }
  | { type: 'DUPLICATE'; payload: Bundle }
  | { type: 'EXPORT'; payload: Bundle }
  | { type: 'CREATE'; payload: CreateBundleRequest };

/**
 * User/Permission Types
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'lawyer' | 'paralegal' | 'viewer';
  permissions: Permission[];
}

export type Permission =
  | 'create_bundle'
  | 'edit_bundle'
  | 'delete_bundle'
  | 'view_bundle'
  | 'add_documents'
  | 'add_annotations'
  | 'export_bundle';

/**
 * Bundle History/Activity Types
 */
export interface BundleActivity {
  id: string;
  bundleId: string;
  userId: string;
  userName: string;
  action:
    | 'created'
    | 'updated'
    | 'deleted'
    | 'exported'
    | 'document_added'
    | 'annotation_added';
  timestamp: string;
  details?: string;
}

/**
 * Export Options
 */
export interface ExportOptions {
  format: 'pdf' | 'zip' | 'docx';
  includeAnnotations: boolean;
  includeMetadata: boolean;
  pageRange?: {
    start: number;
    end: number;
  };
}

/**
 * Utility Types
 */
export type BundleWithDocuments = Bundle & {
  documents: Document[];
};

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
