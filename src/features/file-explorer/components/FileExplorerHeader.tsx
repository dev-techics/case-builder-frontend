import { ChevronDown, ChevronRight } from 'lucide-react';
import ImportDocuments from './ImportDocuments';
import { useAppDispatch } from '@/app/hooks';
import { toggleFolder, type Tree, type Children } from '../redux/fileTreeSlice';
import CreateNewFolder from './CreateNewFolder';
import { Folder01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

interface FileTreeHeaderProps {
  isExpanded: boolean;
  folder: Tree | Children; // Accept both types
  level: number;
}

const FileExplorerHeader = ({
  isExpanded,
  folder,
  level,
}: FileTreeHeaderProps) => {
  const dispatch = useAppDispatch();

  const handleFolderClick = () => {
    dispatch(toggleFolder(folder.id));
  };

  // Get the folder name - check if it's the root Tree or a nested Children folder
  const folderName = 'projectName' in folder ? folder.projectName : folder.name;

  return (
    <div
      className="flex items-center justify-between px-2 py-1 sticky top-0 bg-white border-b border-gray-200 z-10"
      style={{ paddingLeft: `${level * 12 + 8}px` }}
    >
      <div className="flex items-center cursor-pointer ">
        {isExpanded ? (
          <ChevronDown
            onClick={handleFolderClick}
            className="mr-1 h-4 w-4 flex-shrink-0"
          />
        ) : (
          <ChevronRight
            onClick={handleFolderClick}
            className="mr-1 h-4 w-4 flex-shrink-0"
          />
        )}
        <HugeiconsIcon
          icon={Folder01Icon}
          className="mr-2 h-4 w-4 flex-shrink-0 text-blue-400"
        />
        <span className="truncate text-gray-800 text-sm">{folderName}</span>
      </div>

      {/* Only show upload handler for root folder (level 0) */}
      {level === 0 && (
        <div className="flex items-center">
          <CreateNewFolder />
          <ImportDocuments bundleId={folder.id} parentId={null} />
        </div>
      )}
    </div>
  );
};

export default FileExplorerHeader;
