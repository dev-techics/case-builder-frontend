import { useRef, useState, type PointerEvent } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { createRedaction } from '@/features/toolbar/redux';
import CommentOverlay from '@/features/toolbar/components/CommentOverlay';
import { InteractiveHighlightOverlay } from '@/features/toolbar/components/HighlightOverlay';
import RedactionOverlay from '@/features/toolbar/components/RedactionOverlay';
import { ScreenToPdfCoordinates } from '../helpers';

type AnnotationLayerProps = {
  fileId: string;
  pageNumber: number;
  pageInfo?: { width: number; height: number };
  scale: number;
};

type DragPoint = {
  x: number;
  y: number;
};

type DraftRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const MIN_REDACTION_SIZE = 4;

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

const AnnotationLayer = ({
  fileId,
  pageNumber,
  pageInfo,
  scale,
}: AnnotationLayerProps) => {
  const dispatch = useAppDispatch();
  const activeTool = useAppSelector(state => state.toolbar.activeTool);
  const redactionStyle = useAppSelector(state => state.toolbar.redactionStyle);
  const bundleId = useAppSelector(state => state.fileTree.tree.id);
  const { headerLeft, headerRight, footer } = useAppSelector(
    state => state.propertiesPanel.headersFooter
  );
  const documentInfo = useAppSelector(
    state => state.propertiesPanel.documentInfo
  );
  const isRedactMode = activeTool === 'redact';
  const dragStartRef = useRef<DragPoint | null>(null);
  const [draftRect, setDraftRect] = useState<DraftRect | null>(null);

  const getRelativePoint = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const updateDraftRect = (start: DragPoint, end: DragPoint) => {
    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    setDraftRect({ left, top, width, height });
    return { left, top, width, height };
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isRedactMode || !pageInfo) {
      return;
    }

    event.preventDefault();

    const start = getRelativePoint(event);
    dragStartRef.current = start;
    setDraftRect({ left: start.x, top: start.y, width: 0, height: 0 });

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isRedactMode || !pageInfo || !dragStartRef.current) {
      return;
    }

    event.preventDefault();
    const current = getRelativePoint(event);
    updateDraftRect(dragStartRef.current, current);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!isRedactMode || !pageInfo || !dragStartRef.current) {
      return;
    }

    event.preventDefault();

    const current = getRelativePoint(event);
    const finalRect = updateDraftRect(dragStartRef.current, current);
    dragStartRef.current = null;
    setDraftRect(null);

    if (
      finalRect.width < MIN_REDACTION_SIZE ||
      finalRect.height < MIN_REDACTION_SIZE
    ) {
      return;
    }

    const screenCoords = {
      left: finalRect.left,
      top: finalRect.top,
      right: finalRect.left + finalRect.width,
      bottom: finalRect.top + finalRect.height,
      width: finalRect.width,
      height: finalRect.height,
    };

    const pageInfoWithOffset = {
      ...pageInfo,
      left: 0,
      top: 0,
    };

    const pdfCoords = ScreenToPdfCoordinates(
      screenCoords,
      pageInfoWithOffset,
      scale
    );

    if (!bundleId) {
      return;
    }

    const resolvedFillHex = redactionStyle.fillHex || '#000000';
    const resolvedOpacity = redactionStyle.fillHex
      ? redactionStyle.opacity
      : 0;

    dispatch(
      createRedaction({
        bundleId: bundleId.split('-')[1],
        data: {
          document_id: fileId,
          page_number: pageNumber,
          x: pdfCoords.x,
          y: pdfCoords.y,
          width: pdfCoords.width,
          height: pdfCoords.height,
          name: redactionStyle.name,
          fill_hex: resolvedFillHex,
          opacity: resolvedOpacity,
          border_hex: redactionStyle.borderHex,
          border_width: redactionStyle.borderWidth,
        },
      })
    );
  };

  const handlePointerCancel = () => {
    dragStartRef.current = null;
    setDraftRect(null);
  };

  const interactionClassName = isRedactMode
    ? 'absolute inset-0 cursor-crosshair pointer-events-auto'
    : 'pointer-events-none absolute inset-0';

  const headerLeftText =
    typeof headerLeft === 'string' ? headerLeft : headerLeft.text || '';
  const headerRightText =
    typeof headerRight === 'string' ? headerRight : headerRight.text || '';
  const footerText =
    typeof footer === 'string' ? footer : footer.text || '';
  const pageCount = documentInfo[fileId]?.numPages ?? null;
  const headerFooterStyles = {
    left: 50 * scale,
    top: 25 * scale,
    bottom: 25 * scale,
  };
  const headerFooterRightX = pageInfo
    ? (pageInfo.width - 120) * scale
    : 0;

  const resolveTextStyle = (color: string | undefined, size: number | undefined) => ({
    color: color || '#4b5563',
    fontSize: `${(size || 10) * scale}px`,
    lineHeight: 1,
    whiteSpace: 'nowrap' as const,
  });

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {pageInfo && (
        <>
          <InteractiveHighlightOverlay
            fileId={fileId}
            pageHeight={pageInfo.height}
            pageNumber={pageNumber}
            scale={scale}
          />
          <CommentOverlay
            fileId={fileId}
            pageHeight={pageInfo.height}
            pageNumber={pageNumber}
            scale={scale}
          />
          <RedactionOverlay
            fileId={fileId}
            pageHeight={pageInfo.height}
            pageNumber={pageNumber}
            scale={scale}
          />
        </>
      )}

      {draftRect && isRedactMode && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: `${draftRect.left}px`,
            top: `${draftRect.top}px`,
            width: `${draftRect.width}px`,
            height: `${draftRect.height}px`,
            backgroundColor: redactionStyle.fillHex
              ? hexToRgba(redactionStyle.fillHex, redactionStyle.opacity)
              : 'transparent',
            border: `${redactionStyle.borderWidth}px solid ${redactionStyle.borderHex}`,
          }}
        />
      )}

      {pageInfo && (headerLeftText || headerRightText || footerText || pageCount) && (
        <div className="pointer-events-none absolute inset-0">
          {headerLeftText && (
            <div
              style={{
                position: 'absolute',
                left: headerFooterStyles.left,
                top: headerFooterStyles.top,
                ...resolveTextStyle(
                  typeof headerLeft === 'string' ? undefined : headerLeft.color,
                  typeof headerLeft === 'string' ? undefined : headerLeft.size
                ),
              }}
            >
              {headerLeftText}
            </div>
          )}
          {headerRightText && (
            <div
              style={{
                position: 'absolute',
                left: headerFooterRightX,
                top: headerFooterStyles.top,
                ...resolveTextStyle(
                  typeof headerRight === 'string' ? undefined : headerRight.color,
                  typeof headerRight === 'string' ? undefined : headerRight.size
                ),
              }}
            >
              {headerRightText}
            </div>
          )}
          {(footerText || pageCount) && (
            <>
              {footerText && (
                <div
                  style={{
                    position: 'absolute',
                    left: headerFooterStyles.left,
                    bottom: headerFooterStyles.bottom,
                    ...resolveTextStyle(
                      typeof footer === 'string' ? undefined : footer.color,
                      typeof footer === 'string' ? undefined : footer.size
                    ),
                  }}
                >
                  {footerText}
                </div>
              )}
              {pageCount && (
                <div
                  style={{
                    position: 'absolute',
                    left: headerFooterRightX,
                    bottom: headerFooterStyles.bottom,
                    ...resolveTextStyle(
                      typeof footer === 'string' ? undefined : footer.color,
                      typeof footer === 'string' ? undefined : footer.size
                    ),
                  }}
                >
                  Page {pageNumber} of {pageCount}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div
        className={`${interactionClassName} z-30`}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};

export default AnnotationLayer;
