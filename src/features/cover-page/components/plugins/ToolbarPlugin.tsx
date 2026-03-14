// components/plugins/ToolbarPlugin.tsx
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Link,
  Image,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FONT_FAMILY_OPTIONS,
  blockTypeToBlockName,
  useToolbarHandlers,
  type BlockType,
} from '../../hook';
import {
  DEFAULT_PAGE_SETUP,
  PAGE_SIZES,
  normalizePageSetup,
  type PageOrientation,
  type PageSetup,
  type PageSizeId,
} from '../../utils/pageSetup';
import lineHeightIcon from '@/assets/line-height-svgrepo-com.svg';

function Divider() {
  return (
    <span
      aria-hidden="true"
      className="mx-1 hidden h-6 w-px shrink-0 bg-gray-200 sm:block"
    />
  );
}

function BlockFormatDropDown({
  blockType,
  onSelect,
}: {
  blockType: BlockType;
  onSelect: (value: BlockType) => void;
}) {
  // Dropdown for block-level formatting (paragraph, heading, list, etc.).
  return (
    <Select
      value={blockType}
      onValueChange={value => onSelect(value as BlockType)}
    >
      <SelectTrigger className="h-8 w-[120px] text-xs sm:w-[140px]">
        <SelectValue>{blockTypeToBlockName[blockType] || 'Normal'}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="paragraph">Normal</SelectItem>
        <SelectItem value="h1">Heading 1</SelectItem>
        <SelectItem value="h2">Heading 2</SelectItem>
        <SelectItem value="h3">Heading 3</SelectItem>
        <SelectItem value="bullet">Bulleted List</SelectItem>
        <SelectItem value="number">Numbered List</SelectItem>
        <SelectItem value="quote">Quote</SelectItem>
        <SelectItem value="code">Code Block</SelectItem>
      </SelectContent>
    </Select>
  );
}

type ToolbarPluginProps = {
  pageSetup: PageSetup;
  onPageSetupChange: (setup: PageSetup) => void;
};

const buildMarginInputState = (setup: PageSetup) => ({
  top: setup.margin.top.toString(),
  right: setup.margin.right.toString(),
  bottom: setup.margin.bottom.toString(),
  left: setup.margin.left.toString(),
});

export default function ToolbarPlugin({
  pageSetup,
  onPageSetupChange,
}: ToolbarPluginProps) {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [isPageSetupOpen, setIsPageSetupOpen] = useState(false);
  const [pageSetupDraft, setPageSetupDraft] = useState<PageSetup>(pageSetup);
  const [marginInputs, setMarginInputs] = useState(() =>
    buildMarginInputState(pageSetup)
  );

  // All Lexical interactions live in a dedicated hook to keep this UI readable.
  const { state, actions, derived } = useToolbarHandlers(editor);
  const {
    canUndo,
    canRedo,
    blockType,
    fontFamily,
    fontSize,
    lineHeight,
    isBold,
    isItalic,
    isUnderline,
    isStrikethrough,
    isCode,
    isLink,
    selectedImage,
  } = state;
  const { isImageSelected, imageWidthValue } = derived;
  const {
    undo,
    redo,
    formatText,
    toggleLink,
    insertImage,
    setFontFamily,
    setFontSize,
    setLineHeight,
    applyBlockType,
    align,
    justify,
    setImageWidthFromInput,
    resetImageWidth,
  } = actions;

  const lineHeightOptions = useMemo(
    () => ['1', '1.15', '1.5', '2', '2.5', '3'],
    []
  );

  useEffect(() => {
    if (!isPageSetupOpen) {
      return;
    }
    setPageSetupDraft(pageSetup);
    setMarginInputs(buildMarginInputState(pageSetup));
  }, [isPageSetupOpen, pageSetup]);

  const paperSizeOptions = useMemo(() => PAGE_SIZES, []);

  const updateDraft = (next: Partial<PageSetup>) => {
    setPageSetupDraft(current => normalizePageSetup({ ...current, ...next }));
  };

  const updateMarginInput = (
    field: keyof PageSetup['margin'],
    value: string
  ) => {
    setMarginInputs(current => ({ ...current, [field]: value }));
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return;
    }
    setPageSetupDraft(current =>
      normalizePageSetup({
        ...current,
        margin: {
          ...current.margin,
          [field]: parsed,
        },
      })
    );
  };

  const handlePageSetupSave = () => {
    onPageSetupChange(normalizePageSetup(pageSetupDraft));
    setIsPageSetupOpen(false);
  };

  const handlePageSetupReset = () => {
    setPageSetupDraft(DEFAULT_PAGE_SETUP);
    setMarginInputs(buildMarginInputState(DEFAULT_PAGE_SETUP));
  };

  return (
    <div
      className="toolbar flex items-center gap-1 overflow-x-auto border-b border-gray-200 bg-gray-50 p-2 sm:flex-wrap sm:overflow-visible"
      ref={toolbarRef}
    >
      {/* History controls */}
      <Button
        variant="ghost"
        size="sm"
        disabled={!canUndo}
        onClick={undo}
        className="h-8 w-8 p-0"
        aria-label="Undo"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={!canRedo}
        onClick={redo}
        className="h-8 w-8 p-0"
        aria-label="Redo"
      >
        <Redo className="h-4 w-4" />
      </Button>

      <Divider />

      {/* Block type selector */}
      <BlockFormatDropDown blockType={blockType} onSelect={applyBlockType} />

      <Divider />

      {/* Font family + size */}
      <Select
        value={fontFamily}
        onValueChange={setFontFamily}
        disabled={isImageSelected}
      >
        <SelectTrigger className="h-8 w-[120px] text-xs sm:w-[160px]">
          <SelectValue placeholder="Font" />
        </SelectTrigger>
        <SelectContent>
          {FONT_FAMILY_OPTIONS.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={8}
          className="h-8 w-14 px-2 text-xs sm:w-16"
          value={fontSize}
          onChange={event => setFontSize(event.target.value)}
          placeholder="Size"
          disabled={isImageSelected}
        />
        <span className="text-[10px] text-gray-500">px</span>
      </div>

      <Divider />

      {/* Text styles */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatText('bold')}
        className={`h-8 w-8 p-0 ${isBold ? 'bg-gray-200' : ''}`}
        aria-label="Format Bold"
        title="bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatText('italic')}
        className={`h-8 w-8 p-0 ${isItalic ? 'bg-gray-200' : ''}`}
        aria-label="Format Italic"
        title="italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatText('underline')}
        className={`h-8 w-8 p-0 ${isUnderline ? 'bg-gray-200' : ''}`}
        aria-label="Format Underline"
        title="underline"
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatText('strikethrough')}
        className={`h-8 w-8 p-0 ${isStrikethrough ? 'bg-gray-200' : ''}`}
        aria-label="Format Strikethrough"
        title="strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatText('code')}
        className={`h-8 w-8 p-0 ${isCode ? 'bg-gray-200' : ''}`}
        aria-label="Format Code"
        title="formate code"
      >
        <Code className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLink}
        className={`h-8 w-8 p-0 ${isLink ? 'bg-gray-200' : ''}`}
        aria-label="Insert Link"
      >
        <Link className="h-4 w-4" />
      </Button>

      <Divider />

      {/* Alignment controls */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => align('left')}
        className={`h-8 w-8 p-0 ${
          selectedImage?.alignment === 'left' ? 'bg-gray-200' : ''
        }`}
        aria-label="Left Align"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => align('center')}
        className={`h-8 w-8 p-0 ${
          selectedImage?.alignment === 'center' ? 'bg-gray-200' : ''
        }`}
        aria-label="Center Align"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => align('right')}
        className={`h-8 w-8 p-0 ${
          selectedImage?.alignment === 'right' ? 'bg-gray-200' : ''
        }`}
        aria-label="Right Align"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={justify}
        className="h-8 w-8 p-0"
        aria-label="Justify Align"
      >
        <AlignJustify className="h-4 w-4" />
      </Button>

      {/* ----------- Line height --------------- */}
      <Select
        value={lineHeight || ''}
        onValueChange={value => setLineHeight(value)}
        disabled={isImageSelected}
      >
        <SelectTrigger
          className="h-8 w-[90px] text-xs"
          aria-label="Line height"
        >
          <img
            src={lineHeightIcon}
            alt=""
            aria-hidden="true"
            className="h-4 w-4"
          />
          <SelectValue placeholder={null} />
        </SelectTrigger>
        <SelectContent>
          {lineHeightOptions.map(option => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Divider />

      {/* Image insertion */}
      <Button
        variant="ghost"
        size="sm"
        onClick={insertImage}
        className="h-8 w-8 p-0"
        aria-label="Insert Image"
      >
        <Image className="h-4 w-4" />
      </Button>

      <Divider />

      {/* Image sizing controls (shown only when an image node is selected) */}
      {selectedImage && (
        <>
          <Divider />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Width</span>
            <Input
              type="number"
              min={50}
              className="h-8 w-16 px-2 text-xs sm:w-20"
              value={imageWidthValue}
              onChange={event => setImageWidthFromInput(event.target.value)}
              placeholder="Auto"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={resetImageWidth}
            >
              Auto
            </Button>
          </div>
        </>
      )}

      {/* Page setup dialog */}
      <Dialog open={isPageSetupOpen} onOpenChange={setIsPageSetupOpen}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsPageSetupOpen(true)}
          className="h-8 px-2 text-xs"
          aria-label="Page Setup"
        >
          <Settings2 className="mr-2 h-4 w-4" />
          Page setup
        </Button>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Page setup</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 text-sm">
            <div className="grid gap-2">
              <span className="font-medium text-gray-700">Orientation</span>
              <Select
                value={pageSetupDraft.orientation}
                onValueChange={value =>
                  updateDraft({ orientation: value as PageOrientation })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Orientation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <span className="font-medium text-gray-700">Paper size</span>
              <Select
                value={pageSetupDraft.size}
                onValueChange={value =>
                  updateDraft({ size: value as PageSizeId })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Paper size" />
                </SelectTrigger>
                <SelectContent>
                  {paperSizeOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <span className="font-medium text-gray-700">Page color</span>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  className="h-9 w-20 p-1"
                  value={pageSetupDraft.backgroundColor}
                  onChange={event =>
                    updateDraft({ backgroundColor: event.target.value })
                  }
                  aria-label="Page color"
                />
                <span className="text-xs text-gray-500">
                  {pageSetupDraft.backgroundColor.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <span className="font-medium text-gray-700">
                Margins (centimeters)
              </span>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500" htmlFor="margin-top">
                    Top
                  </label>
                  <Input
                    id="margin-top"
                    type="number"
                    min={0}
                    step={0.01}
                    value={marginInputs.top}
                    onChange={event =>
                      updateMarginInput('top', event.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    className="text-xs text-gray-500"
                    htmlFor="margin-bottom"
                  >
                    Bottom
                  </label>
                  <Input
                    id="margin-bottom"
                    type="number"
                    min={0}
                    step={0.01}
                    value={marginInputs.bottom}
                    onChange={event =>
                      updateMarginInput('bottom', event.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    className="text-xs text-gray-500"
                    htmlFor="margin-left"
                  >
                    Left
                  </label>
                  <Input
                    id="margin-left"
                    type="number"
                    min={0}
                    step={0.01}
                    value={marginInputs.left}
                    onChange={event =>
                      updateMarginInput('left', event.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    className="text-xs text-gray-500"
                    htmlFor="margin-right"
                  >
                    Right
                  </label>
                  <Input
                    id="margin-right"
                    type="number"
                    min={0}
                    step={0.01}
                    value={marginInputs.right}
                    onChange={event =>
                      updateMarginInput('right', event.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={handlePageSetupReset}>
              Reset defaults
            </Button>
            <Button variant="outline" onClick={() => setIsPageSetupOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePageSetupSave}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
