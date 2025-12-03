// features/index-generator/types.ts
export type IndexEntry = {
  id: string;
  fileName: string;
  fileId: string;
  startPage: number;
  endPage: number;
  order: number;
};

export type IndexState = {
  entries: IndexEntry[];
  lastUpdated: string;
};
