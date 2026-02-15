import type { MouseEvent } from 'react';
import { CircleX } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { deleteRedaction } from '@/features/toolbar/redux';

type RedactionOverlayProps = {
  fileId: string;
  pageNumber: number;
  pageHeight: number;
  scale: number;
};

function pdfToScreenCoordinates(
  pdfCoords: { x: number; y: number; width: number; height: number },
  pageHeight: number,
  scale: number
) {
  return {
    x: pdfCoords.x * scale,
    y: (pageHeight - pdfCoords.y - pdfCoords.height) * scale,
    width: pdfCoords.width * scale,
    height: pdfCoords.height * scale,
  };
}

const hexToRgba = (hex: string, opacity: number) => {
  const sanitized = hex.replace('#', '');
  const normalized =
    sanitized.length === 3
      ? sanitized
          .split('')
          .map(char => char + char)
          .join('')
      : sanitized;

  const value = Number.parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const RedactionOverlay = ({
  fileId,
  pageNumber,
  pageHeight,
  scale,
}: RedactionOverlayProps) => {
  const dispatch = useAppDispatch();
  const redactions = useAppSelector(state => state.toolbar.redactions);

  const pageRedactions = redactions.filter(
    r => r.fileId === fileId && r.pageNumber === pageNumber
  );

  if (pageRedactions.length === 0) {
    return null;
  }

  const handleDelete = (
    event: MouseEvent<HTMLButtonElement>,
    redactionId: string
  ) => {
    event.stopPropagation();
    dispatch(deleteRedaction({ redactionId }));
  };

  return (
    <div className="pointer-events-none absolute inset-0">
      {pageRedactions.map(redaction => {
        const screenCoords = pdfToScreenCoordinates(
          redaction.coordinates,
          pageHeight,
          scale
        );

        const fillColor = redaction.style.fillHex;
        return (
          <div
            className="group absolute pointer-events-auto"
            key={redaction.id}
            style={{
              left: `${screenCoords.x}px`,
              top: `${screenCoords.y}px`,
              width: `${screenCoords.width}px`,
              height: `${screenCoords.height}px`,
              boxSizing: 'border-box',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: fillColor
                  ? hexToRgba(fillColor, redaction.style.opacity)
                  : 'transparent',
                border: `${redaction.style.borderWidth}px solid ${redaction.style.borderHex}`,
                boxSizing: 'border-box',
              }}
              title="Redaction"
            />

            <button
              className="-right-2 -top-2 absolute z-10 flex h-6 w-6 items-center justify-center rounded-full text-white opacity-0 shadow-lg transition-all duration-200 hover:scale-110 group-hover:opacity-100"
              onClick={event => handleDelete(event, redaction.id)}
              title="Delete redaction"
              type="button"
            >
              <CircleX className="h-5 w-5 cursor-pointer rounded-full bg-gray-800" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default RedactionOverlay;
