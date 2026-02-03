import { useAppSelector } from '@/app/hooks';
import CoverPagePreviewHtml from './CoverPagePreviewHtml';

interface CoverPagePreviewProps {
  type: 'front' | 'back';
}

const CoverPagePreview = ({ type }: CoverPagePreviewProps) => {
  const { frontHtml, backHtml } = useAppSelector(state => state.coverPage);
  const html = type === 'front' ? frontHtml : backHtml;

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
