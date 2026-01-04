import ZoomControls from '@/features/editor/components/ZoomControls';
import PdfViewer from '../../features/editor/Editor';
export default function EditorPage() {
  return (
    <div className="relative rounded bg-white p-6 shadow z-0">
      <h2 className="mb-4 font-bold text-2xl">Document Title Main</h2>
      <PdfViewer />
      <ZoomControls />
    </div>
  );
}
