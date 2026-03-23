import { ChevronDown, ChevronRight } from 'lucide-react';
import { Folder01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import CreateNewFolder from './CreateNewFolder';
import ImportDocuments from './ImportDocuments';

interface FileTreeHeaderProps {
  folderId: string;
  label: string;
  isExpanded: boolean;
  level: number;
  onToggle: () => void;
}

const FileTreeHeader = ({
  folderId,
  label,
  isExpanded,
  level,
  onToggle,
}: FileTreeHeaderProps) => {
  return (
    <div
      className="flex items-center justify-between px-2 py-1 sticky top-0 bg-white border-b border-gray-200 z-10"
      style={{ paddingLeft: `${level * 12 + 8}px` }}
    >
      <div className="flex items-center cursor-pointer">
        {isExpanded ? (
          <ChevronDown
            onClick={onToggle}
            className="mr-1 h-4 w-4 flex-shrink-0"
          />
        ) : (
          <ChevronRight
            onClick={onToggle}
            className="mr-1 h-4 w-4 flex-shrink-0"
          />
        )}

        <HugeiconsIcon
          icon={Folder01Icon}
          className="mr-2 h-4 w-4 flex-shrink-0 text-blue-400"
        />

        <span className="truncate text-gray-800 text-sm">{label}</span>
      </div>

      {level === 0 && (
        <div className="flex items-center">
          <CreateNewFolder />
          <ImportDocuments bundleId={folderId} parentId={null} />
        </div>
      )}
    </div>
  );
};

export default FileTreeHeader;
