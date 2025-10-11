import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
    clearFileHighlights,
    clearHighlights,
    removeHighlight,
} from "../editorSlice";

export function HighlightsSidebar() {
    const highlights = useAppSelector((state) => state.editor.highlights);
    const dispatch = useAppDispatch();

    // Group highlights by file
    const highlightsByFile = highlights.reduce(
        (acc, highlight) => {
            if (!acc[highlight.fileId]) {
                acc[highlight.fileId] = [];
            }
            acc[highlight.fileId].push(highlight);
            return acc;
        },
        {} as Record<string, typeof highlights>
    );

    const totalHighlights = highlights.length;

    return (
        <div className="h-full w-80 overflow-y-auto border-l bg-white shadow-sm">
            <div className="p-4">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-bold text-xl">Highlights ({totalHighlights})</h2>
                    {totalHighlights > 0 && (
                        <button
                            className="font-medium text-red-600 text-sm hover:text-red-700"
                            onClick={() => dispatch(clearHighlights())}
                            type="button"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {/* Empty state */}
                {totalHighlights === 0 && (
                    <div className="py-12 text-center">
                        <div className="mb-4 text-6xl">📝</div>
                        <p className="mb-2 text-gray-500">No highlights yet</p>
                        <p className="text-gray-400 text-sm">
                            Select text in any PDF to create highlights
                        </p>
                    </div>
                )}

                {/* Highlights grouped by file */}
                {Object.entries(highlightsByFile).map(([fileId, fileHighlights]) => (
                    <div className="mb-6" key={fileId}>
                        {/* File header */}
                        <div className="mb-2 flex items-center justify-between border-b pb-2">
                            <div>
                                <h3 className="font-semibold text-sm">File: {fileId}</h3>
                                <p className="text-gray-500 text-xs">
                                    {fileHighlights.length} highlight
                                    {fileHighlights.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                            <button
                                className="text-red-600 text-xs hover:text-red-700"
                                onClick={() => dispatch(clearFileHighlights(fileId))}
                            >
                                Clear
                            </button>
                        </div>

                        {/* Highlights for this file */}
                        <div className="space-y-2">
                            {fileHighlights
                                .sort((a, b) => a.pageNumber - b.pageNumber)
                                .map((highlight) => (
                                    <div
                                        className="rounded-lg border bg-gray-50 p-3 transition-colors hover:border-gray-400"
                                        key={highlight.id}
                                    >
                                        <div className="mb-2 flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="h-4 w-4 rounded border border-gray-300"
                                                    style={{
                                                        backgroundColor: highlight.color.hex,
                                                    }}
                                                    title={highlight.color.name}
                                                />
                                                <span className="font-medium text-sm">
                                                    Page {highlight.pageNumber}
                                                </span>
                                            </div>
                                            <button
                                                className="text-gray-400 transition-colors hover:text-red-600"
                                                onClick={() => dispatch(removeHighlight(highlight.id))}
                                                title="Remove highlight"
                                            >
                                                <svg
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        d="M6 18L18 6M6 6l12 12"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                    />
                                                </svg>
                                            </button>
                                        </div>

                                        <div
                                            className="mb-2 rounded p-2 text-sm"
                                            style={{
                                                backgroundColor: highlight.color.hex + "40",
                                                borderLeft: `3px solid ${highlight.color.hex}`,
                                            }}
                                        >
                                            "{highlight.text}"
                                        </div>

                                        <div className="font-mono text-gray-400 text-xs">
                                            x: {highlight.coordinates.x.toFixed(1)}, y:{" "}
                                            {highlight.coordinates.y.toFixed(1)}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}

                {/* Stats */}
                {totalHighlights > 0 && (
                    <div className="mt-6 rounded-lg bg-blue-50 p-3">
                        <h4 className="mb-2 font-semibold text-sm">Statistics</h4>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total highlights:</span>
                                <span className="font-medium">{totalHighlights}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Files:</span>
                                <span className="font-medium">
                                    {Object.keys(highlightsByFile).length}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
