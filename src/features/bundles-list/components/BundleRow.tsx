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
} from 'lucide-react';
import BundleStatusMenu from './BundleStatusMenu';
import { Folder02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { BundleCardProps } from '../types';

const BundleRow = ({
  bundle,
  lastModifiedLabel,
  lastModifiedTitle,
  onOpen,
  onRename,
  onDelete,
  onDuplicate,
  onExport,
  onStatusChange,
  isStatusUpdating = false,
}: BundleCardProps) => {
  const handleRowClick = () => {
    onOpen(bundle);
  };
  const handleDelete = (bundleId: string | number) => {
    if (confirm('Are you sure you want to delete this bundle?')) {
      onDelete?.(bundleId);
    }
  };

  return (
    <tr
      className="hover:bg-gray-50 transition-colors cursor-pointer group"
      onClick={handleRowClick}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <HugeiconsIcon
            className="h-5 w-5 text-gray-500"
            icon={Folder02Icon}
          />
          <div>
            <div className="font-medium text-gray-900">{bundle.name}</div>
            <div className="text-sm text-gray-500 font-mono">
              {bundle.caseNumber}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {bundle.totalDocuments} documents
      </td>
      <td className="px-6 py-4">
        <BundleStatusMenu
          className="px-3"
          disabled={isStatusUpdating}
          onChange={status => onStatusChange?.(status)}
          status={bundle.status}
        />
      </td>
      <td className="px-6 py-4 text-sm text-gray-500" title={lastModifiedTitle}>
        {lastModifiedLabel}
      </td>
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
            <DropdownMenuItem onClick={handleRowClick}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Open Bundle
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!onRename}
              onClick={() => onRename?.(bundle)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!onDuplicate}
              onClick={() => onDuplicate?.(bundle)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!onExport}
              onClick={() => onExport?.(bundle)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              disabled={!onDelete}
              onClick={() => handleDelete(bundle.id)}
            >
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
