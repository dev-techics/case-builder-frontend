/**
 * Bundle Status Types
 */
export type BundleStatus = 'In Progress' | 'Complete' | 'Review' | 'Archived';

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
  totalDocument: number; // Frontend uses camelCase
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
