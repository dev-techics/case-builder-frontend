import type { Editor } from 'grapesjs';
import type { MutableRefObject } from 'react';
import type { PageSetup } from '../../../utils/pageSetup';
import EditorToolbar from '../EditorToolbar';
import type { InspectorPanel, LibraryPanel } from './config';

type PanelRef = MutableRefObject<HTMLDivElement | null>;

interface GrapesEditorShellProps {
  editor: Editor | null;
  isReady: boolean;
  leftPanel: LibraryPanel;
  onLeftPanelChange: (panel: LibraryPanel) => void;
  pageSetup: PageSetup;
  onPageSetupChange: (pageSetup: PageSetup) => void;
  rightPanel: InspectorPanel;
  onRightPanelChange: (panel: InspectorPanel) => void;
  canvasRef: PanelRef;
  blocksRef: PanelRef;
  layersRef: PanelRef;
  stylesRef: PanelRef;
  traitsRef: PanelRef;
}

const GrapesEditorShell = ({
  editor,
  isReady,
  leftPanel,
  onLeftPanelChange,
  pageSetup,
  onPageSetupChange,
  rightPanel,
  onRightPanelChange,
  canvasRef,
  blocksRef,
  layersRef,
  stylesRef,
  traitsRef,
}: GrapesEditorShellProps) => (
  <div className="cover-page-builder-shell flex h-[90vh] min-h-0 flex-col gap-4 xl:grid xl:grid-cols-[260px_minmax(0,1fr)_320px] xl:gap-4">
    {/* Left Panel */}
    <aside className="min-h-[240px] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm xl:min-h-0">
      <div className="border-b border-gray-200 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Canvas Library</p>
        <p className="text-xs text-slate-500">
          Drag blocks in or inspect the layer stack.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <div
          className={leftPanel === 'blocks' ? 'h-full' : 'hidden'}
          ref={blocksRef}
        />
        <div
          className={leftPanel === 'layers' ? 'h-full' : 'hidden'}
          ref={layersRef}
        />
      </div>
    </aside>
    {/* Main Canvas */}
    <div className="flex min-h-[520px] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm xl:min-h-0">
      <EditorToolbar
        editor={editor}
        isReady={isReady}
        leftPanel={leftPanel}
        onLeftPanelChange={onLeftPanelChange}
        onPageSetupChange={onPageSetupChange}
        pageSetup={pageSetup}
        rightPanel={rightPanel}
        onRightPanelChange={onRightPanelChange}
      />
      <div className="relative min-h-0 flex-1 bg-slate-100">
        <div className="h-full min-h-0" ref={canvasRef} />
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <p className="text-sm text-slate-500">
              Preparing the template builder...
            </p>
          </div>
        )}
      </div>
    </div>
    {/* Right Panel */}
    <aside className="min-h-[260px] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm xl:min-h-0">
      <div className="border-b border-gray-200 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Inspector</p>
        <p className="text-xs text-slate-500">
          Adjust styles or edit selected component settings.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <div
          className={rightPanel === 'styles' ? 'h-full' : 'hidden'}
          ref={stylesRef}
        />
        <div
          className={rightPanel === 'traits' ? 'h-full' : 'hidden'}
          ref={traitsRef}
        />
      </div>
    </aside>
  </div>
);

export default GrapesEditorShell;
