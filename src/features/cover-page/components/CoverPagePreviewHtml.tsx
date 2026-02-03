// components/CoverPagePreviewHtml.tsx
import React from 'react';

interface CoverPagePreviewHtmlProps {
  type: 'front' | 'back';
  html: string;
}

const CoverPagePreviewHtml: React.FC<CoverPagePreviewHtmlProps> = ({
  type,
  html,
}) => {
  const hasInlineWrapper = /data-cover-page=['"]content['"]/.test(html);
  // A4 dimensions in pixels at 96 DPI (standard screen resolution)
  // A4 is 210mm x 297mm = 793px x 1122px at 96 DPI
  const pageWidth = 793;
  const pageHeight = 1122;
  const scale = 0.6; // Scale down for preview

  return (
    <div
      className="relative mx-auto bg-white"
      data-cover-type={type}
      style={{
        width: `${pageWidth * scale}px`,
        height: `${pageHeight * scale}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      {/* A4 Page Background */}
      <div
        className="absolute inset-0 bg-white shadow-lg overflow-hidden"
        style={{
          width: `${pageWidth}px`,
          height: `${pageHeight}px`,
        }}
      >
        {/* Rendered HTML content */}
        <div
          className={`cover-page-content${hasInlineWrapper ? '' : ' p-8'}`}
          dangerouslySetInnerHTML={{ __html: html }}
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
          }}
        />
      </div>
    </div>
  );
};

export default CoverPagePreviewHtml;
