export const MAX_NAME_LENGTH = 70;

/**
 * All measurements are in millimetres, matching real A4 dimensions.
 * The CSS renders the page at 794px wide × 1123px tall (96 dpi A4 equivalent).
 */
export const A4 = {
  // Physical A4 in mm
  pageHeightMm: 297,
  pageWidthMm: 210,

  // Rendered pixel size (96 dpi: 1 mm ≈ 3.7795 px)
  pageHeightPx: 1123,
  pageWidthPx: 594,

  // Margins / chrome (mm)
  topMarginMm: 20,
  bottomMarginMm: 20,
  titleHeightMm: 15, // space the "TABLE OF CONTENTS" heading occupies
  titleSpacingMm: 10, // gap below the heading

  // Row heights (mm)
  folderRowHeightMm: 8,
  fileRowHeightMm: 6,
  folderGapMm: 2, // extra visual breathing room above a folder row
} as const;

// usable height on the FIRST page (heading takes space)
export const FIRST_PAGE_USABLE_MM =
  A4.pageHeightMm -
  A4.topMarginMm -
  A4.bottomMarginMm -
  A4.titleHeightMm -
  A4.titleSpacingMm;

// usable height on SUBSEQUENT pages (no heading)
export const SUBSEQUENT_PAGE_USABLE_MM =
  A4.pageHeightMm - A4.topMarginMm - A4.bottomMarginMm;
