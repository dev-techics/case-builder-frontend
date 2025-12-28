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
  FolderOpen,
  Edit,
  Copy,
  Download,
  Trash2,
  FileStack,
} from 'lucide-react';
import type {
  BundleRowProps,
  StatusColorMap,
  ColorClassMap,
} from '../types/types';

const BundleRow = ({ bundle, onOpen }: BundleRowProps) => {
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

  const handleRowClick = () => {
    onOpen(bundle);
  };

  return (
    <tr
      className="hover:bg-gray-50 transition-colors cursor-pointer group"
      onClick={handleRowClick}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-1 h-12 rounded ${colorClasses[bundle.color]}`} />
          <FileStack className="h-8 w-8 text-gray-400" />
          <div>
            <div className="font-medium text-gray-900">{bundle.name}</div>
            <div className="text-sm text-gray-500 font-mono">
              {bundle.caseNumber}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {bundle.documentCount} documents
      </td>
      <td className="px-6 py-4">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[bundle.status]}`}
        >
          {bundle.status}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">{bundle.lastModified}</td>
      <td className="px-6 py-4">
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
            <DropdownMenuItem>
              <FolderOpen className="h-4 w-4 mr-2" />
              Open Bundle
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Edit Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Export
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
};

export default BundleRow;
