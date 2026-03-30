import { useEffect } from 'react';
import { useAppDispatch } from '../../app/hooks';
import FilesTree from './components/FilesTree';
import { useParams } from 'react-router-dom';
import { loadHighlights, loadRedactions } from '../toolbar/redux';
import { useGetTreeQuery } from './api';
import { normalizeBundleId } from '@/lib/bundleId';

const FileTree: React.FC = () => {
  const dispatch = useAppDispatch();
  const { bundleId: routeBundleId } = useParams<{ bundleId: string }>();
  const bundleId = normalizeBundleId(routeBundleId);

  // Trigger loading the tree via RTK Query.
  // The slice listens to `getTree` via matchers and normalizes the server response.
  useGetTreeQuery(bundleId ?? '', {
    skip: !bundleId,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (!bundleId) return;
    dispatch(loadHighlights({ bundleId: bundleId }));
    dispatch(loadRedactions({ bundleId: bundleId }));
  }, [bundleId, dispatch]);

  return (
    <div className="h-screen w-full  bg-white text-gray-800">
      <div className="border-gray-300 border-b p-4">
        <h2 className="font-semibold text-gray-800 text-xs uppercase tracking-wider">
          Explorer
        </h2>
      </div>
      <div className="py-1 overflow-y-auto">
        <FilesTree level={0} />
      </div>
    </div>
  );
};

export default FileTree;
