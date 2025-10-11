// Helper function for coordinate conversion
export const ScreenToPdfCoordinates = (
  screenCoords: any,
  pageData: any,
  scale: number
) => {
  const pdfLeft = (screenCoords.left - (pageData.left || 0)) / scale;
  const pdfTop = (screenCoords.top - (pageData.top || 0)) / scale;
  const pdfRight = (screenCoords.right - (pageData.left || 0)) / scale;
  const pdfBottom = (screenCoords.bottom - (pageData.top || 0)) / scale;

  const pdfY = pageData.height - pdfBottom;
  const pdfHeight = pdfBottom - pdfTop;

  return {
    x: pdfLeft,
    y: pdfY,
    width: pdfRight - pdfLeft,
    height: pdfHeight,
  };
};
