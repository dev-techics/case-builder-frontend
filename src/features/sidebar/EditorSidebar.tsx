import LeftSidebar from '@/components/sidebars/LeftSidebar';
import FileTree from '../file-explorer/FileExplorer';

const EditorLeftSidebar = () => {
  return (
    <LeftSidebar>
      <FileTree />
    </LeftSidebar>
  );
};

export default EditorLeftSidebar;
