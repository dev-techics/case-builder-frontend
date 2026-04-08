import ZoomControls from '@/features/editor/components/ZoomControls';
import PdfViewer from '../../features/editor/Editor';
export default function EditorPage() {
  return (
    <div className="relative z-0 flex h-full min-h-0 flex-col rounded bg-white p-6 shadow">
      <div className="min-h-0 flex-1">
        <PdfViewer />
      </div>
      <ZoomControls />
    </div>
  );
}
