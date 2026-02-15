import ZoomControls from '@/features/editor/components/ZoomControls';
import PdfViewer from '../../features/editor/Editor';
// import { useAppSelector } from '@/app/hooks';
export default function EditorPage() {
  // const documentTitle = useAppSelector(
  //   state => state.fileTree.tree.projectName
  // );

  return (
    <div className="relative z-0 flex h-full min-h-0 flex-col rounded bg-white p-6 shadow">
      {/* <h2 className="mb-4 font-bold text-2xl">{documentTitle}</h2> */}
      <div className="min-h-0 flex-1">
        <PdfViewer />
      </div>
      <ZoomControls />
    </div>
  );
}
