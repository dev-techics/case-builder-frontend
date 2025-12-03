// features/index-generator/hooks/useGenerateIndexPDF.ts
import { useCallback } from "react";
import { useAppSelector } from "@/app/hooks";
import type { IndexEntry } from "../types";
import generateIndexPDF from "../utils/generateIndexPDF";

export function useGenerateIndexPDF() {
  const tree = useAppSelector((state) => state.fileTree.tree);
  const projectName = useAppSelector(
    (state) => state.fileTree.tree.name || "Project"
  );

  const generatePDF = useCallback(
    async (entries: IndexEntry[]): Promise<Blob> => {
      if (entries.length === 0) {
        throw new Error("No entries to generate index");
      }

      const pdfBytes = await generateIndexPDF(entries, projectName);
      return new Blob([pdfBytes], { type: "application/pdf" });
    },
    [projectName]
  );

  return { generatePDF };
}
