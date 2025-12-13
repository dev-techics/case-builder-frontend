// features/toolbar/components/CommentOverlay.tsx
import { useAppSelector } from '@/app/hooks';
import CommentMarker from './CommentMarker';

type CommentOverlayProps = {
  fileId: string;
  pageNumber: number;
  pageHeight: number;
  scale: number;
};

const CommentOverlay = ({
  fileId,
  pageNumber,
  pageHeight,
  scale,
}: CommentOverlayProps) => {
  const comments = useAppSelector(state => state.toolbar.comments);

  // Filter comments for this specific file and page
  const pageComments = comments.filter(
    comment => comment.fileId === fileId && comment.pageNumber === pageNumber
  );

  if (pageComments.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0">
      {pageComments.map(comment => (
        <CommentMarker
          comment={comment}
          key={comment.id}
          pageHeight={pageHeight}
          scale={scale}
        />
      ))}
    </div>
  );
};

export default CommentOverlay;
