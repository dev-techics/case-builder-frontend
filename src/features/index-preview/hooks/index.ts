// ─── How many index pages will there be? (needed for content start-page calc) ─

import type { FileTreeNode } from '@/features/file-explorer/types/fileTree';
import { hasAnyFiles } from '../utils';
import {
  A4,
  FIRST_PAGE_USABLE_MM,
  SUBSEQUENT_PAGE_USABLE_MM,
} from '../constants';
import type { IndexEntry } from '../types';

/**
 * Returns the number of A4 pages the index itself will occupy.
 * Mirrors paginateEntries but works on raw nodes so we can call it
 * before page-ranges are computed.
 */
export const calculateIndexPageCount = (
  rootIds: string[],
  nodes: Record<string, FileTreeNode>,
  childrenByParentId: Record<string, string[]>
): number => {
  if (!hasAnyFiles(rootIds, nodes, childrenByParentId)) return 0;

  // Build placeholder entries (we only care about types, not page ranges)
  const placeholders: Array<{ type: 'folder' | 'file' }> = [];
  const walk = (ids: string[]) => {
    for (const id of ids) {
      const item = nodes[id];
      if (!item) continue;
      placeholders.push({ type: item.type === 'folder' ? 'folder' : 'file' });
      if (item.type === 'folder') {
        const childIds = childrenByParentId[item.id] ?? [];
        if (childIds.length > 0) walk(childIds);
      }
    }
  };
  walk(rootIds);

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

// ─── Paginator ────────────────────────────────────────────────────────────────

/**
 * Splits a flat list of IndexEntry items into "pages" (arrays of entries).
 * Each page respects the available vertical space so nothing overflows.
 *
 * We work in millimetres so the maths matches the physical A4 document.
 */
export const paginateEntries = (entries: IndexEntry[]): IndexEntry[][] => {
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

// ─── Index-entry builder (same logic as before, unchanged) ────────────────────

export const buildIndexEntries = (
  rootIds: string[],
  nodes: Record<string, FileTreeNode>,
  childrenByParentId: Record<string, string[]>,
  pageCounts: Record<string, number>,
  startPage: number
): IndexEntry[] => {
  const entries: IndexEntry[] = [];
  const indexCounter: number[] = [];
  let currentPage: number | null = startPage;

  const walk = (ids: string[], level: number) => {
    for (const id of ids) {
      const item = nodes[id];
      if (!item) continue;

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
        const childIds = childrenByParentId[item.id] ?? [];
        if (childIds.length > 0) walk(childIds, level + 1);
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

  walk(rootIds, 0);
  return entries;
};
