import type { IndexPageProps } from '../types';
import { truncateLabel } from '../utils';
import A4Page from './A4Page';

const IndexPage = ({
  entries,
  showHeading,
  onSelectFile,
  scale,
}: IndexPageProps) => (
  <A4Page scale={scale}>
    {/*------------ Show heading at the first page ---------- */}
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

        // Folder entry
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

export default IndexPage;
