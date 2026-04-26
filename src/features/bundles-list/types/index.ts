export const bundleStatuses = [
  'In Progress',
  'Complete',
  'Review',
  'Archived',
] as const;

/**
 * Component prop type
 */
export interface BundleCardProps {
  bundle: Bundle;
  lastModifiedLabel: string;
  lastModifiedTitle?: string;
  onOpen: (bundle: Bundle) => void;
  onStatusChange: (status: BundleStatus) => void;
  onRename: (bundle: Bundle) => void;
  onDelete: (bundleId: string | number) => void;
  onDuplicate: (bundle: Bundle) => void;
  onExport?: (bundle: Bundle) => void;
  isStatusUpdating?: boolean;
}

/**
 * Bundle Status Types
 */
export type BundleStatus = (typeof bundleStatuses)[number];

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
  id: string | number;
  name: string;
  caseNumber: string;
  totalDocuments: number;
  status: BundleStatus;
  createdAt?: string;
  updatedAt?: string;
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
  onDelete?: (bundleId: string | number) => void;
  onDuplicate?: (bundle: Bundle) => void;
  onExport?: (bundle: Bundle) => void;
  onStatusChange?: (status: BundleStatus) => void;
  isStatusUpdating?: boolean;
}

/**
 * Status Color Mapping Type
 */
export type StatusColorMap = {
  [K in BundleStatus]: string;
};

export const bundleStatusColors: StatusColorMap = {
  'In Progress': 'bg-blue-100 text-blue-700',
  Complete: 'bg-green-100 text-green-700',
  Review: 'bg-orange-100 text-orange-700',
  Archived: 'bg-gray-100 text-gray-700',
};

export interface CreateBundleDto {
  name: string;
  caseNumber: string;
  status?: BundleStatus;
  description?: string;
  tags?: string[];
}

/*----------------------------------------------
  Convert frontend-friendly payload to API shape
------------------------------------------------*/
export const toCreateBundlePayload = (bundle: CreateBundleDto) => ({
  name: bundle.name,
  case_number: bundle.caseNumber,
  status: bundle.status,
  description: bundle.description,
  tags: bundle.tags,
});
