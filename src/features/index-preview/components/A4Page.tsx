import { A4 } from '../constants';

const A4Page = ({
  children,
  scale = 1,
}: {
  children: React.ReactNode;
  scale?: number;
}) => {
  const MM_TO_PX = 3.7795;

  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const scaledWidth = A4.pageWidthPx * safeScale;
  const scaledHeight = A4.pageHeightPx * safeScale;
  const topPadding = A4.topMarginMm * MM_TO_PX;
  const bottomPadding = A4.bottomMarginMm * MM_TO_PX;

  return (
    <div
      className="relative mx-auto"
      style={{
        width: `${scaledWidth}px`,
        minHeight: `${scaledHeight}px`,
      }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left bg-white shadow-md"
        style={{
          width: `${A4.pageWidthPx}px`,
          minHeight: `${A4.pageHeightPx}px`,
          padding: `${topPadding}px ${topPadding}px ${bottomPadding}px`,
          boxSizing: 'border-box',
          breakInside: 'avoid',
          pageBreakAfter: 'always',
          transform: `scale(${safeScale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default A4Page;
