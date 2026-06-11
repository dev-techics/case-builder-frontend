import { Rotate02Icon } from '@hugeicons/core-free-icons';
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
    <div className="absolute top-1 right-1 z-40 flex items-center gap-1 rounded-full border border-gray-200 bg-[#dce9ff] px-2 py-2 shadow-md backdrop-blur">
      <button
        aria-label={`Rotate page ${pageNumber} left`}
        className="rounded p-1 text-gray-600 transition cursor-pointer"
        onClick={onRotateRight}
        type="button"
        title="Rotate"
      >
        <HugeiconsIcon className="h-5 w-5" icon={Rotate02Icon} strokeWidth={2} />
      </button>
    </div>
  );
};

export default PageRotationControls;
