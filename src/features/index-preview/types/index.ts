export type IndexEntry = {
  id: string;
  type: 'folder' | 'file';
  name: string;
  level: number;
  indexNumber: string;
  pageRange?: string | null;
};

export interface IndexPageProps {
  entries: IndexEntry[];
  showHeading: boolean;
  onSelectFile: (id: string) => void;
  scale: number;
}
