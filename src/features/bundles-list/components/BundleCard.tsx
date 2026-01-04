import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  FileText,
  FolderOpen,
  Edit,
  Copy,
  Download,
  Trash2,
  FileStack,
} from 'lucide-react';
import type { Bundle, ColorClassMap, StatusColorMap } from '../types/types';

// Component Props Types
interface BundleCardProps {
  bundle: Bundle;
  onOpen: (bundle: Bundle) => void;
  onEdit?: (bundle: Bundle) => void;
  onDelete: (bundleId: string | number) => void;
  onDuplicate: (bundle: Bundle) => void;
  onExport?: (bundle: Bundle) => void;
}

const BundleCard = ({
  bundle,
  onOpen,
  onDelete,
  onDuplicate,
}: BundleCardProps) => {
  const statusColors: StatusColorMap = {
    'In Progress': 'bg-blue-100 text-blue-700',
    Complete: 'bg-green-100 text-green-700',
    Review: 'bg-orange-100 text-orange-700',
    Archived: 'bg-gray-100 text-gray-700',
  };

  const colorClasses: ColorClassMap = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
  };
  const handleCardClick = () => {
    onOpen(bundle);
  };
  const handleDelete = (id: string | number) => {
    confirm('Are you sure you want to delete this bundle?') && onDelete(id);
  };
  const handleDuplicate = () => {
    onDuplicate(bundle);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group">
      <div className={`h-2 ${colorClasses[bundle.color]}`} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div
              onClick={handleCardClick}
              className="flex items-center gap-2 mb-2 cursor-pointer"
            >
              <FileStack className="h-5 w-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900 line-clamp-1">
                {bundle.name}
              </h3>
            </div>
            <p className="text-xs text-gray-500 font-mono">
              {bundle.caseNumber}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCardClick}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Open Bundle
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicate()}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(bundle.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="h-4 w-4" />
            <span>{bundle.documentsCount} documents</span>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[bundle.status]}`}
          >
            {bundle.status}
          </span>
        </div>

        <div className="text-xs text-gray-500">
          Last modified: {bundle.updatedAt}
        </div>
      </div>
    </div>
  );
};

export default BundleCard;
