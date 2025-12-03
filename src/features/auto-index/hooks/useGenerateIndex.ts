// features/index-generator/hooks/useGenerateIndex.ts
/**
 * this hooks generate index number by iterating through the files
 */

import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { generateIndex } from "../autoIndexSlice";
import type { IndexEntry } from "../types";

export function useGenerateIndex() {
  const dispatch = useAppDispatch();
  const tree = useAppSelector((state) => state.fileTree.tree);
  const documentInfo = useAppSelector(
    (state) => state.propertiesPanel.documentInfo
  );

  const generateIndexFromFiles = useCallback(() => {
    const entries: IndexEntry[] = [];
    let currentPage = 1;

    // Iterate through files in order
    tree.children.forEach((file, index) => {
      if (file.type === "file" && file.url) {
        const pageCount = documentInfo?.[file.id]?.numPages || 0;

        entries.push({
          id: `index-${file.id}`,
          fileName: file.name,
          fileId: file.id,
          startPage: currentPage,
          endPage: currentPage + pageCount - 1,
          order: index,
        });

        currentPage += pageCount;
      }
    });

    // Dispatch to Redux
    dispatch(generateIndex(entries));
  }, [tree, documentInfo, dispatch]);

  // Regenerate index when files change
  useEffect(() => {
    generateIndexFromFiles();
  }, [generateIndexFromFiles]);

  return { entries: useAppSelector((state) => state.indexGenerator.entries) };
}
