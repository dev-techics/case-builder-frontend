import { RotateCcw, RotateCw } from 'lucide-react';

type PageRotationControlsProps = {
  pageNumber: number;
  rotation: number;
  onRotateLeft: () => void;
  onRotateRight: () => void;
};

const PageRotationControls = ({
  pageNumber,
  rotation,
  onRotateLeft,
  onRotateRight,
}: PageRotationControlsProps) => {
  return (
    <div className="absolute top-3 right-3 z-40 flex items-center gap-1 rounded-md border border-gray-200 bg-white/95 px-2 py-1 shadow-sm backdrop-blur">
      <button
        aria-label={`Rotate page ${pageNumber} left`}
        className="rounded p-1 text-gray-600 transition hover:bg-gray-100"
        onClick={onRotateLeft}
        type="button"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
      <span className="min-w-[52px] text-center text-[11px] font-medium text-gray-600">
        {rotation}deg
      </span>
      <button
        aria-label={`Rotate page ${pageNumber} right`}
        className="rounded p-1 text-gray-600 transition hover:bg-gray-100"
        onClick={onRotateRight}
        type="button"
      >
        <RotateCw className="h-4 w-4" />
      </button>
    </div>
  );
};

export default PageRotationControls;
