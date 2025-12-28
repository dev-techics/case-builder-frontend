import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import FilesTree from './components/FilesTree';
import { loadTreeFromBackend } from './fileTreeSlice';
import { useParams } from 'react-router-dom';
import { loadHighlights } from '../toolbar/toolbarSlice';

const FileTree: React.FC = () => {
  const tree = useAppSelector(state => state.fileTree.tree);

  const dispatch = useAppDispatch();
  const { bundleId } = useParams<{ bundleId: string }>();

  useEffect(() => {
    if (!bundleId) return;
    dispatch(loadTreeFromBackend(Number(bundleId)));
    dispatch(loadHighlights({ bundleId: bundleId }));
  }, [bundleId, dispatch]);

  return (
    <div className="h-screen w-64 overflow-auto bg-white text-gray-800">
      <div className="border-gray-300 border-b p-4">
        <h2 className="font-semibold text-gray-800 text-xs uppercase tracking-wider">
          Explorer
        </h2>
      </div>
      <div className="py-1">
        <FilesTree tree={tree} level={0} />
      </div>
    </div>
  );
};

export default FileTree;
