/** biome-ignore-all lint/a11y/noSvgWithoutTitle: <explanation> */
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { addHighlight, cancelHighlight } from "../editorSlice";
import type { Highlight, HighlightColor } from "../types";

export const HIGHLIGHT_COLORS: HighlightColor[] = [
    { name: "Yellow", rgb: { r: 1, g: 1, b: 0 }, hex: "#FFFF00", opacity: 0.3 },
    { name: "Green", rgb: { r: 0, g: 1, b: 0.2 }, hex: "#00FF33", opacity: 0.3 },
    { name: "Blue", rgb: { r: 0.2, g: 0.7, b: 1 }, hex: "#33B3FF", opacity: 0.3 },
    { name: "Pink", rgb: { r: 1, g: 0.4, b: 0.7 }, hex: "#FF66B2", opacity: 0.3 },
    { name: "Orange", rgb: { r: 1, g: 0.6, b: 0 }, hex: "#FF9900", opacity: 0.3 },
    {
        name: "Purple",
        rgb: { r: 0.7, g: 0.3, b: 1 },
        hex: "#B34DFF",
        opacity: 0.3,
    },
];

/**
 * This component:
 * 1. Reads the pending highlight from Redux
 * 2. Shows color options
 * 3. Creates the final highlight when a color is selected
 * 4. Clears the text selection after highlight creation
 */

export function HighlightColorPicker() {
    const [isVisible, setIsVisible] = useState(false);

    // Get data from Redux
    const position = useAppSelector((state) => state.editor.colorPickerPosition);
    const pendingHighlight = useAppSelector(
        (state) => state.editor.pendingHighlight
    );
    const dispatch = useAppDispatch();

    // Show/hide based on position
    useEffect(() => {
        if (position && position.x !== null && position.y !== null) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [position]);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest(".highlight-color-picker")) {
                dispatch(cancelHighlight());

                // Clear the text selection
                const selection = window.getSelection();
                if (selection) {
                    selection.removeAllRanges();
                }
            }
        };

        if (isVisible) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }
    }, [isVisible, dispatch]);

    const handleClose = () => {
        dispatch(cancelHighlight());

        // Clear the text selection
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
        }
    };

    const handleColorClick = (color: HighlightColor) => {
        if (!pendingHighlight) {
            console.warn("⚠️ No pending highlight data");
            return;
        }

        // Create the final highlight with the selected color
        const highlight: Highlight = {
            id: `highlight-${Date.now()}-${Math.random()}`,
            fileId: pendingHighlight.fileId,
            pageNumber: pendingHighlight.pageNumber,
            coordinates: pendingHighlight.coordinates,
            text: pendingHighlight.text,
            color,
        };

        console.log("✅ Creating highlight:", highlight);

        // Add highlight to Redux store
        dispatch(addHighlight(highlight));

        // Close the color picker and clear pending data
        dispatch(cancelHighlight());

        // Clear the text selection
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
        }
    };

    // Don't render if no position or not visible
    if (!(position && isVisible) || position.x === null || position.y === null) {
        return null;
    }

    // Show warning if no pending highlight (shouldn't happen, but good safeguard)
    if (!pendingHighlight) {
        console.warn("⚠️ Color picker visible but no pending highlight");
        return null;
    }

    return (
        <div
            className="highlight-color-picker fade-in slide-in-from-bottom-2 fixed z-50 animate-in duration-200"
            style={{
                left: `${position.x}px`,
                top: `${position.y - 50}px`,
                transform: "translateX(-50%)",
            }}
        >
            <div className="flex items-center gap-2 rounded-lg border-2 border-gray-200 bg-white p-2 shadow-xl">
                {/* Color options */}
                {HIGHLIGHT_COLORS.map((color) => (
                    <button
                        className="group relative h-8 w-8 cursor-pointer rounded-full border-2 border-gray-300 transition-all duration-150 hover:scale-110 hover:border-gray-500"
                        key={color.name}
                        onClick={() => handleColorClick(color)}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                        type="button"
                    >
                        <span className="-bottom-8 -translate-x-1/2 pointer-events-none absolute left-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-white text-xs opacity-0 transition-opacity group-hover:opacity-100">
                            {color.name}
                        </span>
                    </button>
                ))}

                {/* Divider */}
                <div className="h-8 w-px bg-gray-300" />

                {/* Cancel button */}
                <button
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
                    onClick={handleClose}
                    title="Cancel"
                    type="button"
                >
                    <svg
                        className="h-4 w-4 text-gray-600"
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

            {/* Arrow pointing down to selection */}
            <div
                className="-translate-x-1/2 -bottom-2 absolute left-1/2 h-0 w-0 border-transparent border-t-8 border-t-white border-r-8 border-l-8"
                style={{ filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.1))" }}
            />

            {/* Debug info (optional, remove in production) */}
            {process.env.NODE_ENV === "development" && (
                <div className="-translate-x-1/2 absolute top-full left-1/2 mt-2 whitespace-nowrap rounded bg-gray-900 p-2 text-white text-xs shadow-lg">
                    File: {pendingHighlight.fileId} | Page: {pendingHighlight.pageNumber}
                </div>
            )}
        </div>
    );
}
