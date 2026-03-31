import { useAppSelector } from '@/app/hooks';
import CoverPagePreviewHtml from './CoverPagePreviewHtml';
import { selectCoverPageByType } from '../../redux/selectors';
import type { CoverPageType } from '../../types';

interface CoverPagePreviewProps {
  type: CoverPageType;
}

const CoverPagePreview = ({ type }: CoverPagePreviewProps) => {
  const html = useAppSelector(
    state => selectCoverPageByType(state, type)?.html
  );

  if (!html) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>No template selected</p>
      </div>
    );
  }

  return <CoverPagePreviewHtml type={type} html={html} />;
};

export default CoverPagePreview;
