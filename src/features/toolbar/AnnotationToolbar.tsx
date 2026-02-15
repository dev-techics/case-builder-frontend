import { useMemo, useState, type ReactNode } from 'react';
import {
  Highlighter,
  MessageSquareText,
  MousePointer2,
  Pencil,
  Scissors,
  X,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import ColorPicker from '@/features/toolbar/components/ColorPicker';
import InputComment from '@/features/toolbar/components/InputComment';
import {
  cancelCommentCreation,
  cancelHighlight,
  setActiveTool,
  setRedactionStyle,
} from '@/features/toolbar/redux';
import type {
  AnnotationTool,
  RedactionStyle,
} from '@/features/toolbar/types/types';

const TOOL_DEFINITIONS: Array<{
  id: AnnotationTool;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
}> = [
  {
    id: 'select',
    label: 'Select',
    icon: <MousePointer2 className="h-4 w-4" />,
  },
  {
    id: 'highlight',
    label: 'Highlight',
    icon: <Highlighter className="h-4 w-4" />,
  },
  {
    id: 'comment',
    label: 'Comment',
    icon: <MessageSquareText className="h-4 w-4" />,
  },
  {
    id: 'redact',
    label: 'Redact',
    icon: <Scissors className="h-4 w-4" />,
  },
  {
    id: 'draw',
    label: 'Draw',
    icon: <Pencil className="h-4 w-4" />,
    disabled: true,
  },
];

const REDACTION_COLORS: Array<{ name: string; hex: string }> = [
  { name: 'Black', hex: '#000000' },
  { name: 'Dark Gray', hex: '#1f2937' },
  { name: 'Red', hex: '#dc2626' },
];

const REDACTION_FILL_OPTIONS: Array<{ name: string; hex: string | null }> = [
  { name: 'None', hex: null },
  ...REDACTION_COLORS,
];

const AnnotationToolbar = () => {
  const dispatch = useAppDispatch();
  const activeTool = useAppSelector(state => state.toolbar.activeTool);
  const pendingHighlight = useAppSelector(
    state => state.toolbar.pendingHighlight
  );
  const pendingComment = useAppSelector(state => state.toolbar.pendingComment);
  const redactionStyle = useAppSelector(state => state.toolbar.redactionStyle);
  const [redactionTarget, setRedactionTarget] = useState<'fill' | 'border'>(
    'fill'
  );

  const statusText = useMemo(() => {
    switch (activeTool) {
      case 'highlight':
        return pendingHighlight
          ? 'Pick a color to apply the highlight.'
          : 'Select text to highlight.';
      case 'comment':
        return 'Select text to add a comment.';
      case 'redact':
        return 'Drag on the page to mark a redaction area.';
      case 'draw':
        return 'Draw tool is coming soon.';
      default:
        return 'Choose a tool to start annotating.';
    }
  }, [activeTool, pendingHighlight]);

  const clearSelection = () => {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  };

  const handleToolChange = (tool: AnnotationTool) => {
    const nextTool = tool === activeTool ? 'select' : tool;
    dispatch(setActiveTool(nextTool));

    if (nextTool !== 'highlight') {
      dispatch(cancelHighlight());
      clearSelection();
    }

    if (nextTool !== 'comment') {
      dispatch(cancelCommentCreation());
    }
  };

  const handleClearHighlight = () => {
    dispatch(cancelHighlight());
    clearSelection();
  };

  const handleRedactionTargetChange = (target: 'fill' | 'border') => {
    setRedactionTarget(target);

    if (target === 'border') {
      const borderName =
        REDACTION_COLORS.find(c => c.hex === redactionStyle.borderHex)?.name ||
        'Custom';
      dispatch(
        setRedactionStyle({
          ...redactionStyle,
          fillHex: null,
          opacity: 0,
          name: `Border ${borderName}`,
        })
      );
      return;
    }

    const defaultFillHex = redactionStyle.fillHex || REDACTION_COLORS[0].hex;
    const fillName =
      REDACTION_COLORS.find(c => c.hex === defaultFillHex)?.name || 'Custom';
    dispatch(
      setRedactionStyle({
        ...redactionStyle,
        fillHex: defaultFillHex,
        opacity: 1,
        name: `Fill ${fillName}`,
      })
    );
  };

  const handleRedactionColorChange = (colorName: string) => {
    const isFill = redactionTarget === 'fill';
    const colorOption = isFill
      ? REDACTION_FILL_OPTIONS.find(option => option.name === colorName)
      : REDACTION_COLORS.find(option => option.name === colorName);

    const nextStyle: RedactionStyle = {
      ...redactionStyle,
      name: `${isFill ? 'Fill' : 'Border'} ${colorOption?.name || 'Custom'}`,
    };

    if (isFill) {
      nextStyle.fillHex = colorOption?.hex ?? null;
      nextStyle.opacity = colorOption?.hex ? 1 : 0;
    } else if (colorOption?.hex) {
      nextStyle.borderHex = colorOption.hex;
    }

    dispatch(setRedactionStyle(nextStyle));
  };

  const selectedRedactionColor = useMemo(() => {
    if (redactionTarget === 'fill') {
      if (!redactionStyle.fillHex || redactionStyle.opacity === 0) {
        return 'None';
      }
      return (
        REDACTION_COLORS.find(c => c.hex === redactionStyle.fillHex)?.name ||
        'Custom'
      );
    }

    return (
      REDACTION_COLORS.find(c => c.hex === redactionStyle.borderHex)?.name ||
      'Custom'
    );
  }, [
    redactionTarget,
    redactionStyle.borderHex,
    redactionStyle.fillHex,
    redactionStyle.opacity,
  ]);

  const redactionColorOptions =
    redactionTarget === 'fill' ? REDACTION_FILL_OPTIONS : REDACTION_COLORS;
  const showCustomOption =
    selectedRedactionColor === 'Custom' &&
    !redactionColorOptions.some(option => option.name === 'Custom');

  return (
    <div className="annotation-toolbar border-gray-200 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {TOOL_DEFINITIONS.map(tool => {
            const isActive = activeTool === tool.id;
            const isDisabled = tool.disabled;
            return (
              <button
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                } ${isDisabled ? 'cursor-not-allowed opacity-40' : ''}`}
                disabled={isDisabled}
                key={tool.id}
                onClick={() => handleToolChange(tool.id)}
                type="button"
              >
                {tool.icon}
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {activeTool === 'highlight' && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">Colors</span>
              <div
                className={`flex items-center gap-2 ${
                  pendingHighlight ? '' : 'pointer-events-none opacity-40'
                }`}
              >
                <ColorPicker />
              </div>
              {pendingHighlight && (
                <button
                  className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-gray-600 text-xs transition hover:bg-gray-50"
                  onClick={handleClearHighlight}
                  type="button"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>
          )}

          {activeTool === 'redact' && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">Redact</span>
              <div className="flex items-center gap-2">
                <select
                  className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onChange={event =>
                    handleRedactionTargetChange(
                      event.target.value as 'fill' | 'border'
                    )
                  }
                  value={redactionTarget}
                >
                  <option value="fill">Fill</option>
                  <option value="border">Border</option>
                </select>

                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded border border-gray-300"
                    style={{
                      backgroundColor:
                        redactionTarget === 'fill'
                          ? redactionStyle.fillHex || 'transparent'
                          : redactionStyle.borderHex,
                    }}
                  />
                  <select
                    className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onChange={event =>
                      handleRedactionColorChange(event.target.value)
                    }
                    value={selectedRedactionColor}
                  >
                    {showCustomOption && <option value="Custom">Custom</option>}
                    {redactionColorOptions.map(option => (
                      <option key={option.name} value={option.name}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <span className="max-w-sm text-gray-500 text-xs">{statusText}</span>
        </div>
      </div>

      {activeTool === 'comment' && pendingComment && (
        <div className="mx-auto max-w-xl">
          <InputComment />
        </div>
      )}
    </div>
  );
};

export default AnnotationToolbar;
