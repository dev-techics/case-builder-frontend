// GrapesEditorShell.tsx
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
  <div className="cover-page-builder-shell flex h-screen max-h-screen flex-col overflow-hidden lg:h-[calc(100vh-4rem)]">
    <div className="flex min-h-0 flex-1 gap-0 p-0 lg:gap-3 lg:p-3">
      {/* Left Panel — both panels reveal together at lg to avoid squeezing the canvas */}
      <aside className="hidden w-[200px] shrink-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm lg:flex xl:w-[240px]">
        <div className="shrink-0 border-b border-gray-200 px-3 py-2">
          <p className="text-xs font-semibold text-slate-900">Library</p>
          <p className="text-xs leading-tight text-slate-500">
            Drag blocks or inspect layers.
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-2">
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
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-none border-x border-gray-200 bg-white shadow-sm lg:rounded-lg lg:border">
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

        {/* Canvas viewport — overflow-hidden clips the GrapesJS iframe to its box */}
        <div className="relative min-h-0 flex-1 overflow-hidden bg-slate-100">
          <div className="h-full w-full" ref={canvasRef} />
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <p className="text-sm text-slate-500">
                Preparing the template builder...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel — deferred to lg to match left panel */}
      <aside className="hidden w-[200px] shrink-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm lg:flex xl:w-[280px]">
        <div className="shrink-0 border-b border-gray-200 px-3 py-2">
          <p className="text-xs font-semibold text-slate-900">Inspector</p>
          <p className="text-xs leading-tight text-slate-500">
            Styles and component settings.
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-2">
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
  </div>
);

export default GrapesEditorShell;
