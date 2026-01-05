import ZoomControls from '@/features/editor/components/ZoomControls';
import PdfViewer from '../../features/editor/Editor';
import { useAppSelector } from '@/app/hooks';
export default function EditorPage() {
  const documentTitle = useAppSelector(
    state => state.fileTree.tree.projectName
  );
  return (
    <div className="relative rounded bg-white p-6 shadow z-0">
      <h2 className="mb-4 font-bold text-2xl">{documentTitle}</h2>
      <PdfViewer />
      <ZoomControls />
    </div>
  );
}
