import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  selectFile,
  type Children,
} from '@/features/file-explorer/redux/fileTreeSlice';

// ─── Types ────────────────────────────────────────────────────────────────────

type IndexEntry = {
  id: string;
  type: 'folder' | 'file';
  name: string;
  level: number;
  indexNumber: string;
  pageRange?: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_NAME_LENGTH = 70;

/**
 * All measurements are in millimetres, matching real A4 dimensions.
 * The CSS renders the page at 794px wide × 1123px tall (96 dpi A4 equivalent).
 */
const A4 = {
  // Physical A4 in mm
  pageHeightMm: 297,
  pageWidthMm: 210,

  // Rendered pixel size (96 dpi: 1 mm ≈ 3.7795 px)
  pageHeightPx: 1123,
  pageWidthPx: 794,

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
const FIRST_PAGE_USABLE_MM =
  A4.pageHeightMm -
  A4.topMarginMm -
  A4.bottomMarginMm -
  A4.titleHeightMm -
  A4.titleSpacingMm;

// usable height on SUBSEQUENT pages (no heading)
const SUBSEQUENT_PAGE_USABLE_MM =
  A4.pageHeightMm - A4.topMarginMm - A4.bottomMarginMm;

// ─── Pure Helpers ─────────────────────────────────────────────────────────────

const truncateLabel = (value: string): string =>
  value.length <= MAX_NAME_LENGTH
    ? value
    : `${value.slice(0, MAX_NAME_LENGTH - 3)}…`;

const hasAnyFiles = (nodes: Children[]): boolean => {
  for (const node of nodes) {
    if (node.type === 'file') return true;
    if (node.type === 'folder' && node.children && hasAnyFiles(node.children))
      return true;
  }
  return false;
};

// ─── Index-entry builder (same logic as before, unchanged) ────────────────────

const buildIndexEntries = (
  nodes: Children[],
  pageCounts: Record<string, number>,
  startPage: number
): IndexEntry[] => {
  const entries: IndexEntry[] = [];
  const indexCounter: number[] = [];
  let currentPage: number | null = startPage;

  const walk = (items: Children[], level: number) => {
    for (const item of items) {
      indexCounter[level] = (indexCounter[level] ?? 0) + 1;
      indexCounter.length = level + 1;

      const indexNumber = indexCounter.slice(0, level + 1).join('.');

      if (item.type === 'folder') {
        entries.push({
          id: item.id,
          type: 'folder',
          name: item.name,
          level,
          indexNumber,
        });
        if (item.children?.length) walk(item.children, level + 1);
        continue;
      }

      const start = currentPage;
      const pageCount = pageCounts[item.id];
      let pageRange: string | null = null;

      if (typeof start === 'number') {
        if (Number.isFinite(pageCount) && pageCount > 0) {
          const end = start + pageCount - 1;
          pageRange = pageCount > 1 ? `${start}-${end}` : `${start}`;
          currentPage = end + 1;
        } else {
          pageRange = `${start}-?`;
          currentPage = null;
        }
      }

      entries.push({
        id: item.id,
        type: 'file',
        name: item.name,
        level,
        indexNumber,
        pageRange,
      });
    }
  };

  walk(nodes, 0);
  return entries;
};

// ─── Paginator ────────────────────────────────────────────────────────────────

/**
 * Splits a flat list of IndexEntry items into "pages" (arrays of entries).
 * Each page respects the available vertical space so nothing overflows.
 *
 * We work in millimetres so the maths matches the physical A4 document.
 */
const paginateEntries = (entries: IndexEntry[]): IndexEntry[][] => {
  if (entries.length === 0) return [];

  const pages: IndexEntry[][] = [];
  let currentPage: IndexEntry[] = [];
  let usedMm = 0;
  let isFirstPage = true;

  const availableMm = () =>
    isFirstPage ? FIRST_PAGE_USABLE_MM : SUBSEQUENT_PAGE_USABLE_MM;

  const flushPage = () => {
    pages.push(currentPage);
    currentPage = [];
    usedMm = 0;
    isFirstPage = false;
  };

  for (const entry of entries) {
    const rowMm =
      entry.type === 'folder'
        ? A4.folderRowHeightMm + A4.folderGapMm
        : A4.fileRowHeightMm;

    // If this row doesn't fit, start a new page first
    if (currentPage.length > 0 && usedMm + rowMm > availableMm()) {
      flushPage();
    }

    currentPage.push(entry);
    usedMm += rowMm;
  }

  if (currentPage.length > 0) flushPage();

  return pages;
};

// ─── How many index pages will there be? (needed for content start-page calc) ─

/**
 * Returns the number of A4 pages the index itself will occupy.
 * Mirrors paginateEntries but works on raw nodes so we can call it
 * before page-ranges are computed.
 */
const calculateIndexPageCount = (nodes: Children[]): number => {
  if (!hasAnyFiles(nodes)) return 0;

  // Build placeholder entries (we only care about types, not page ranges)
  const placeholders: Array<{ type: 'folder' | 'file' }> = [];
  const walk = (items: Children[]) => {
    for (const item of items) {
      placeholders.push({ type: item.type === 'folder' ? 'folder' : 'file' });
      if (item.type === 'folder' && item.children?.length) walk(item.children);
    }
  };
  walk(nodes);

  let pages = 1;
  let usedMm = 0;
  let isFirstPage = true;

  const available = () =>
    isFirstPage ? FIRST_PAGE_USABLE_MM : SUBSEQUENT_PAGE_USABLE_MM;

  for (const p of placeholders) {
    const rowMm =
      p.type === 'folder'
        ? A4.folderRowHeightMm + A4.folderGapMm
        : A4.fileRowHeightMm;

    if (usedMm > 0 && usedMm + rowMm > available()) {
      pages += 1;
      usedMm = 0;
      isFirstPage = false;
    }

    usedMm += rowMm;
  }

  return pages;
};

// ─── A4 Page Shell ────────────────────────────────────────────────────────────

const A4Page = ({ children }: { children: React.ReactNode }) => (
  <div
    className="relative mx-auto bg-white shadow-md"
    style={{
      width: `${A4.pageWidthPx}px`,
      minHeight: `${A4.pageHeightPx}px`,
      padding: `${A4.topMarginMm * 3.7795}px ${A4.topMarginMm * 3.7795}px ${A4.bottomMarginMm * 3.7795}px`,
      boxSizing: 'border-box',
      breakInside: 'avoid',
      pageBreakAfter: 'always',
    }}
  >
    {children}
  </div>
);

// ─── Single page of index entries ────────────────────────────────────────────

interface IndexPageProps {
  entries: IndexEntry[];
  showHeading: boolean;
  onSelectFile: (id: string) => void;
}

const IndexPage = ({ entries, showHeading, onSelectFile }: IndexPageProps) => (
  <A4Page>
    {showHeading && (
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-wide text-gray-900">
          TABLE OF CONTENTS
        </h1>
      </div>
    )}

    <div className="space-y-1">
      {entries.map((entry, i) => {
        const label = `${entry.indexNumber}. ${entry.name}`;
        const indentPx = entry.level * 20;

        if (entry.type === 'folder') {
          return (
            <div
              key={`idx-folder-${entry.id}`}
              className={`font-semibold uppercase text-gray-700 ${i > 0 ? 'mt-2' : ''}`}
              style={{ paddingLeft: indentPx }}
            >
              {label.toUpperCase()}
            </div>
          );
        }

        const pageText = entry.pageRange ?? '—';
        const isUnknown = pageText.includes('?') || pageText === '—';

        return (
          <button
            key={`idx-file-${entry.id}`}
            type="button"
            className="grid w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-4 text-left text-gray-600 hover:text-gray-900"
            style={{ paddingLeft: indentPx }}
            onClick={() => onSelectFile(entry.id)}
          >
            <span className="truncate text-sm">{truncateLabel(label)}</span>
            <span
              className={`w-16 text-right text-xs ${
                isUnknown ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {pageText}
            </span>
          </button>
        );
      })}
    </div>
  </A4Page>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const IndexPreview = () => {
  const dispatch = useAppDispatch();
  const tree = useAppSelector(state => state.fileTree.tree);
  const documentInfo = useAppSelector(
    state => state.propertiesPanel.documentInfo
  );

  // ── 1. Do we have any files at all?
  const hasFiles = useMemo(() => hasAnyFiles(tree.children), [tree.children]);

  // ── 2. How many pages will the index occupy?
  const indexPageCount = useMemo(
    () => (hasFiles ? calculateIndexPageCount(tree.children) : 0),
    [tree.children, hasFiles]
  );

  // ── 3. Build flat entry list (with page ranges)
  const entries = useMemo(() => {
    if (!hasFiles) return [];

    const pageCounts: Record<string, number> = {};
    for (const [fileId, info] of Object.entries(documentInfo)) {
      if (info?.numPages) pageCounts[fileId] = info.numPages;
    }

    // Content starts after the index pages (index pages are pages 1…N)
    const contentStartPage = Math.max(1, indexPageCount + 1);
    return buildIndexEntries(tree.children, pageCounts, contentStartPage);
  }, [documentInfo, hasFiles, indexPageCount, tree.children]);

  // ── 4. Split entries across A4 pages
  const pages = useMemo(() => paginateEntries(entries), [entries]);

  // ── 5. Warning flag
  const hasUnknownPages = useMemo(
    () =>
      entries.some(
        e => e.type === 'file' && (!e.pageRange || e.pageRange.includes('?'))
      ),
    [entries]
  );

  // ── Empty state
  if (!hasFiles) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-400">
        No documents available
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      {pages.map((pageEntries, pageIdx) => (
        <IndexPage
          key={`index-page-${pageIdx}`}
          entries={pageEntries}
          showHeading={pageIdx === 0}
          onSelectFile={id => dispatch(selectFile(id))}
        />
      ))}

      {hasUnknownPages && (
        <p className="text-center text-xs text-gray-400">
          Page numbers update as PDFs load.
        </p>
      )}
    </div>
  );
};

export default IndexPreview;
