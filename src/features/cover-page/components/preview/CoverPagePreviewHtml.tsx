import { useMemo } from 'react';
import {
  DEFAULT_PAGE_SETUP,
  extractPageSetupFromHtml,
  getPageDimensions,
} from '../../utils/pageSetup';
import { COVER_PAGE_WRAPPER_SELECTOR } from '../../utils/grapesBuilder';
import type { CoverPageType } from '../../types';

interface CoverPagePreviewHtmlProps {
  type: CoverPageType;
  html: string;
}

const CoverPagePreviewHtml = ({ type, html }: CoverPagePreviewHtmlProps) => {
  const hasInlineWrapper = /data-cover-page=['"]content['"]/.test(html);
  const pageSetup = useMemo(
    () =>
      extractPageSetupFromHtml(html, COVER_PAGE_WRAPPER_SELECTOR) ??
      DEFAULT_PAGE_SETUP,
    [html]
  );
  const { widthCm, heightCm } = getPageDimensions(pageSetup);
  const pxPerCm = 96 / 2.54;
  const pageWidth = widthCm * pxPerCm;
  const pageHeight = heightCm * pxPerCm;
  const scale = 0.6;

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
        className="absolute inset-0 shadow-lg overflow-hidden"
        style={{
          width: `${pageWidth}px`,
          height: `${pageHeight}px`,
          backgroundColor: pageSetup.backgroundColor,
        }}
      >
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
