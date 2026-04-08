export interface CreateBundleDto {
  name: string;
  case_number: string;
  status?: 'In Progress' | 'Complete' | 'Review' | 'Archived';
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
  description?: string;
  tags?: string[];
}
