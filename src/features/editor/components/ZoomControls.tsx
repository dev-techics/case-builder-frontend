import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setScale, zoomIn, zoomOut } from '../redux/editorSlice';

function ZoomControls() {
  const dispatch = useDispatch();
  const scale = useSelector((state: any) => state.editor.scale);
  const canReset = Math.abs(scale - 1) > 0.01;
  return (
    <div className="fixed bottom-12  left-[40%] z-50 flex w-48 items-center justify-center gap-4 rounded-2xl border-b bg-white px-4 py-2 shadow-lg">
      <button
        aria-label="Zoom out"
        className="rounded p-2 hover:bg-gray-100"
        onClick={() => dispatch(zoomOut())}
        type="button"
      >
        <ZoomOut className="h-5 w-5" />
      </button>
      <button
        aria-label="Reset zoom"
        className="rounded p-2 hover:bg-gray-100 disabled:opacity-50"
        onClick={() => dispatch(setScale(1))}
        type="button"
        disabled={!canReset}
      >
        <RotateCcw className="h-4 w-4" />
      </button>
      {/* <span className="min-w-[60px] text-center font-medium text-sm">
        {Math.round(scale * 100)}%
      </span> */}
      <button
        aria-label="Zoom in"
        className="rounded p-2 hover:bg-gray-100"
        onClick={() => dispatch(zoomIn())}
        type="button"
      >
        <ZoomIn className="h-5 w-5" />
      </button>
    </div>
  );
}

export default ZoomControls;
