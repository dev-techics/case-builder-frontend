import { ChevronDown, ChevronRight } from 'lucide-react';
import FileUploadHandler from './fileUploadHandler';
import { useAppDispatch } from '@/app/hooks';
import { toggleFolder, type Tree, type Children } from '../redux/fileTreeSlice';
// import CreateNewFolder from './CreateNewFolder';
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
      className="flex items-center justify-between px-2 py-1"
      onClick={handleFolderClick}
      style={{ paddingLeft: `${level * 12 + 8}px` }}
    >
      <div className="flex items-center cursor-pointer ">
        {isExpanded ? (
          <ChevronDown className="mr-1 h-4 w-4 flex-shrink-0" />
        ) : (
          <ChevronRight className="mr-1 h-4 w-4 flex-shrink-0" />
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
          {/* <CreateNewFolder /> */}
          <FileUploadHandler bundleId={folder.id} />
        </div>
      )}
    </div>
  );
};

export default FileExplorerHeader;
