import CreateNewFolder from './CreateNewFolder';
import ImportDocuments from './ImportDocuments';

interface FileTreeHeaderProps {
  folderId: string;
}

const FileTreeHeader = ({ folderId }: FileTreeHeaderProps) => {
  return (
    <div className="sticky top-0 z-10 border-gray-200 border-b bg-white px-3 py-3">
      <div className="grid grid-cols-2 gap-2">
        <ImportDocuments bundleId={folderId} parentId={null} variant="header" />
        <CreateNewFolder variant="header" />
      </div>
    </div>
  );
};

export default FileTreeHeader;
