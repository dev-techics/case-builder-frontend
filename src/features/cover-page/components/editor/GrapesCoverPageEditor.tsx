import 'grapesjs/dist/css/grapes.min.css';
import { useAppSelector } from '@/app/hooks';
import { selectCoverPageByType } from '../../redux/selectors';
import type { CoverPageType } from '../../types';
import GrapesEditorShell from './grapes/GrapesEditorShell';
import { useGrapesCoverPageEditor } from './grapes/useGrapesCoverPageEditor';

interface GrapesCoverPageEditorProps {
  type: CoverPageType;
}

const GrapesCoverPageEditor = ({ type }: GrapesCoverPageEditorProps) => {
  const template = useAppSelector(state => selectCoverPageByType(state, type));
  const {
    editor,
    isReady,
    pageSetup,
    setPageSetup,
    leftPanel,
    setLeftPanel,
    rightPanel,
    setRightPanel,
    canvasRef,
    blocksRef,
    layersRef,
    stylesRef,
    traitsRef,
  } = useGrapesCoverPageEditor(type, template);

  if (!template) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Template not found</p>
      </div>
    );
  }

  return (
    <GrapesEditorShell
      editor={editor}
      isReady={isReady}
      leftPanel={leftPanel}
      onLeftPanelChange={setLeftPanel}
      pageSetup={pageSetup}
      onPageSetupChange={setPageSetup}
      rightPanel={rightPanel}
      onRightPanelChange={setRightPanel}
      canvasRef={canvasRef}
      blocksRef={blocksRef}
      layersRef={layersRef}
      stylesRef={stylesRef}
      traitsRef={traitsRef}
    />
  );
};

export default GrapesCoverPageEditor;
