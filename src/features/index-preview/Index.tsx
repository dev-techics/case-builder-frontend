import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { selectFile } from '../file-explorer/redux/fileTreeSlice';
import { hasAnyFiles } from './utils';
import IndexPage from './components/IndexPage';
import {
  buildIndexEntries,
  calculateIndexPageCount,
  paginateEntries,
} from './hooks';

const IndexPreview = () => {
  const dispatch = useAppDispatch();
  const tree = useAppSelector(state => state.fileTree.tree);
  const documentInfo = useAppSelector(
    state => state.propertiesPanel.documentInfo
  );
  const scale = useAppSelector(state => state.editor.scale);
  const [paginationState, setPaginationState] = useState({
    pageIndex: 0,
    structureKey: '',
  });

  const nodes = tree.nodes;
  const childrenByParentId = tree.children;
  const rootIds = tree.rootIds;

  // ── 1. Do we have any files at all?
  const hasFiles = useMemo(
    () => hasAnyFiles(rootIds, nodes, childrenByParentId),
    [childrenByParentId, nodes, rootIds]
  );

  // ── 2. How many pages will the index occupy?
  const indexPageCount = useMemo(
    () =>
      hasFiles
        ? calculateIndexPageCount(rootIds, nodes, childrenByParentId)
        : 0,
    [childrenByParentId, hasFiles, nodes, rootIds]
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
    return buildIndexEntries(
      rootIds,
      nodes,
      childrenByParentId,
      pageCounts,
      contentStartPage
    );
  }, [
    childrenByParentId,
    documentInfo,
    hasFiles,
    indexPageCount,
    nodes,
    rootIds,
  ]);

  // ── 4. Split entries across A4 pages
  const pages = useMemo(() => paginateEntries(entries), [entries]);

  const entryStructureKey = useMemo(
    () => entries.map(entry => `${entry.id}:${entry.indexNumber}`).join('|'),
    [entries]
  );

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

  const activePageIndex =
    paginationState.structureKey !== entryStructureKey
      ? 0
      : Math.min(paginationState.pageIndex, Math.max(pages.length - 1, 0));
  const currentPageEntries = pages[activePageIndex] ?? [];
  const hasMultiplePages = pages.length > 1;
  const canGoToPreviousPage = activePageIndex > 0;
  const canGoToNextPage = activePageIndex < pages.length - 1;
  const goToPage = (pageIndex: number) =>
    setPaginationState({
      pageIndex,
      structureKey: entryStructureKey,
    });

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <IndexPage
        key={`index-page-${activePageIndex}`}
        entries={currentPageEntries}
        showHeading={activePageIndex === 0}
        onSelectFile={id => dispatch(selectFile(id))}
        scale={scale}
      />

      {hasUnknownPages && (
        <p className="text-center text-xs text-gray-400">
          Page numbers update as PDFs load.
        </p>
      )}

      {hasMultiplePages && (
        <div className="flex w-full max-w-[900px] flex-wrap items-center justify-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
          {/* ---------- Previous button ----------- */}
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canGoToPreviousPage}
            onClick={() => goToPage(Math.max(activePageIndex - 1, 0))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          {/* ------------ Pagination numbers ------------ */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {pages.map((_, pageIdx) => {
              const isActivePage = pageIdx === activePageIndex;

              return (
                <button
                  key={`index-page-button-${pageIdx}`}
                  type="button"
                  aria-current={isActivePage ? 'page' : undefined}
                  className={`h-9 min-w-9 rounded-full px-3 text-sm font-medium transition ${
                    isActivePage
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900'
                  }`}
                  onClick={() => goToPage(pageIdx)}
                >
                  {pageIdx + 1}
                </button>
              );
            })}
          </div>

          {/* ----------- Next button ------------- */}
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canGoToNextPage}
            onClick={() =>
              goToPage(Math.min(activePageIndex + 1, pages.length - 1))
            }
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default IndexPreview;
