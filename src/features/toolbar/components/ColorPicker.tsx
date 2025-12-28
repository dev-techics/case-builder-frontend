import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  cancelHighlight,
  createHighlight,
} from '@/features/toolbar/toolbarSlice';
import type {
  HighlightColor,
  CreateHighlightRequest,
} from '@/features/toolbar/types/types';

export const HIGHLIGHT_COLORS: HighlightColor[] = [
  { name: 'Yellow', rgb: { r: 1, g: 1, b: 0 }, hex: '#FFFF00', opacity: 0.3 },
  { name: 'Green', rgb: { r: 0, g: 1, b: 0.2 }, hex: '#00FF33', opacity: 0.3 },
  { name: 'Blue', rgb: { r: 0.2, g: 0.7, b: 1 }, hex: '#33B3FF', opacity: 0.3 },
  { name: 'Pink', rgb: { r: 1, g: 0.4, b: 0.7 }, hex: '#FF66B2', opacity: 0.3 },
  { name: 'Orange', rgb: { r: 1, g: 0.6, b: 0 }, hex: '#FF9900', opacity: 0.3 },
  {
    name: 'Purple',
    rgb: { r: 0.7, g: 0.3, b: 1 },
    hex: '#B34DFF',
    opacity: 0.3,
  },
];

/**
 * This component:
 * 1. Reads the pending highlight from Redux
 * 2. Shows color options
 * 3. Creates the final highlight when a color is selected
 * 4. Clears the text selection after highlight creation
 * 5. Scrolls with the page content
 */

function HighlightColorPicker() {
  // Get data from Redux
  const pendingHighlight = useAppSelector(
    state => state.toolbar.pendingHighlight
  );
  const bundleId = useAppSelector(state => state.fileTree.tree.id);
  const dispatch = useAppDispatch();

  const handleColorClick = (color: HighlightColor) => {
    if (!pendingHighlight) {
      console.warn('⚠️ No pending highlight data');
      return;
    }

    // Create the final highlight with the selected color
    const highlight: CreateHighlightRequest = {
      document_id: pendingHighlight.fileId,
      page_number: pendingHighlight.pageNumber,
      x: pendingHighlight.coordinates.x,
      y: pendingHighlight.coordinates.y,
      width: pendingHighlight.coordinates.width,
      height: pendingHighlight.coordinates.height,
      text: pendingHighlight.text,
      color_name: color.name,
      color_rgb: color.rgb,
      color_hex: color.hex,
      opacity: color.opacity,
    };

    console.log('✅ Creating highlight:', highlight);

    // Add highlight to Redux store
    dispatch(
      createHighlight({ bundleId: bundleId.split('-')[1], data: highlight })
    );

    // Close the color picker and clear pending data
    dispatch(cancelHighlight());

    // Clear the text selection
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  };

  return (
    <>
      {/* Color options */}
      {HIGHLIGHT_COLORS.map(color => (
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
    </>
  );
}

export default HighlightColorPicker;
