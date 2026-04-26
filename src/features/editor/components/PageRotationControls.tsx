import { Rotate01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

type PageRotationControlsProps = {
  pageNumber: number;
  rotation: number;
  onRotateLeft: () => void;
  onRotateRight: () => void;
};

const PageRotationControls = ({
  pageNumber,
  onRotateRight,
}: PageRotationControlsProps) => {
  return (
    <div className="absolute top-1 right-1 z-40 flex items-center gap-1 rounded-md border border-gray-200 bg-white/95 px-2 py-1 shadow-sm backdrop-blur">
      <button
        aria-label={`Rotate page ${pageNumber} left`}
        className="rounded p-1 text-gray-600 transition hover:bg-gray-100"
        onClick={onRotateRight}
        type="button"
      >
        <HugeiconsIcon className="h-4 w-4" icon={Rotate01Icon} />
      </button>
    </div>
  );
};

export default PageRotationControls;
