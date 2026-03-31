import { useMemo, useState } from 'react';
import type { Editor } from 'grapesjs';
import {
  LayoutGrid,
  Layers3,
  MousePointer2,
  Palette,
  Redo2,
  Settings2,
  SlidersHorizontal,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PAGE_SIZES, type PageSetup } from '../../utils/pageSetup';
import PageSetupDialog from './PageSetupDialog';
import type { InspectorPanel, LibraryPanel } from './grapes/config';

interface EditorToolbarProps {
  editor: Editor | null;
  isReady: boolean;
  leftPanel: LibraryPanel;
  onLeftPanelChange: (panel: LibraryPanel) => void;
  rightPanel: InspectorPanel;
  onRightPanelChange: (panel: InspectorPanel) => void;
  pageSetup: PageSetup;
  onPageSetupChange: (setup: PageSetup) => void;
}

const ToolbarDivider = () => (
  <span
    aria-hidden="true"
    className="hidden h-6 w-px shrink-0 bg-gray-200 lg:block"
  />
);

const EditorToolbar = ({
  editor,
  isReady,
  leftPanel,
  onLeftPanelChange,
  pageSetup,
  onPageSetupChange,
  rightPanel,
  onRightPanelChange,
}: EditorToolbarProps) => {
  const [isPageSetupOpen, setIsPageSetupOpen] = useState(false);

  const pageSummary = useMemo(() => {
    const sizeLabel =
      PAGE_SIZES.find(option => option.id === pageSetup.size)?.label ??
      pageSetup.size.toUpperCase();

    return `${sizeLabel.split('(')[0].trim()} • ${pageSetup.orientation}`;
  }, [pageSetup.orientation, pageSetup.size]);

  const runEditorCommand = (command: string) => {
    if (!editor || !isReady) {
      return;
    }

    editor.runCommand(command);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white/90 px-3 py-3 backdrop-blur">
        <div className="flex items-center gap-1">
          <Button
            variant={leftPanel === 'blocks' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onLeftPanelChange('blocks')}
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            Blocks
          </Button>
          <Button
            variant={leftPanel === 'layers' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onLeftPanelChange('layers')}
          >
            <Layers3 className="mr-2 h-4 w-4" />
            Layers
          </Button>
        </div>

        <ToolbarDivider />

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={!isReady}
            onClick={() => runEditorCommand('core:undo')}
          >
            <Undo2 className="mr-2 h-4 w-4" />
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!isReady}
            onClick={() => runEditorCommand('core:redo')}
          >
            <Redo2 className="mr-2 h-4 w-4" />
            Redo
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!isReady}
            onClick={() => editor?.select()}
          >
            <MousePointer2 className="mr-2 h-4 w-4" />
            Clear Selection
          </Button>
        </div>

        <ToolbarDivider />

        <div className="flex items-center gap-1">
          <Button
            variant={rightPanel === 'styles' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onRightPanelChange('styles')}
          >
            <Palette className="mr-2 h-4 w-4" />
            Styles
          </Button>
          <Button
            variant={rightPanel === 'traits' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onRightPanelChange('traits')}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Traits
          </Button>
        </div>

        <ToolbarDivider />

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs font-medium text-slate-500 md:inline">
            {pageSummary}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPageSetupOpen(true)}
          >
            <Settings2 className="mr-2 h-4 w-4" />
            Page Setup
          </Button>
        </div>
      </div>

      {isPageSetupOpen && (
        <PageSetupDialog
          open={isPageSetupOpen}
          pageSetup={pageSetup}
          onOpenChange={setIsPageSetupOpen}
          onSave={onPageSetupChange}
        />
      )}
    </>
  );
};

export default EditorToolbar;
