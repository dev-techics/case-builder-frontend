import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import grapesjs, { type Editor } from 'grapesjs';
import { useAppDispatch } from '@/app/hooks';
import {
  setCoverPageBuilderState,
  setCoverPageHtml,
} from '../../../redux/coverPageSlice';
import type { CoverPageTemplate, CoverPageType } from '../../../types';
import {
  DEFAULT_PAGE_SETUP,
  extractPageSetupFromHtml,
  type PageSetup,
} from '../../../utils/pageSetup';
import {
  COVER_PAGE_WRAPPER_SELECTOR,
  buildPersistedCoverPageHtml,
  createDefaultCoverPageHtml,
  normalizeCoverPageCanvasHtml,
  parseCoverPageBuilderState,
  serializeCoverPageBuilderState,
} from '../../../utils/grapesBuilder';
import {
  CANVAS_FRAME_STYLES,
  STYLE_MANAGER_SECTORS,
  type InspectorPanel,
  type LibraryPanel,
} from './config';
import { registerCoverPageBlocks } from './blocks';
import { ensureCoverPageRoot } from './root';

export const useGrapesCoverPageEditor = (
  type: CoverPageType,
  template: CoverPageTemplate | null
) => {
  const dispatch = useAppDispatch();

  const builderState = useMemo(
    () => parseCoverPageBuilderState(template?.builderState),
    [template?.builderState]
  );
  const htmlPageSetup = useMemo(
    () =>
      extractPageSetupFromHtml(
        template?.html ?? '',
        COVER_PAGE_WRAPPER_SELECTOR
      ),
    [template?.html]
  );

  const initialPageSetup =
    builderState.pageSetup ?? htmlPageSetup ?? DEFAULT_PAGE_SETUP;

  const [pageSetup, setPageSetup] = useState<PageSetup>(initialPageSetup);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [leftPanel, setLeftPanel] = useState<LibraryPanel>('blocks');
  const [rightPanel, setRightPanel] = useState<InspectorPanel>('styles');
  const [isReady, setIsReady] = useState(false);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const blocksRef = useRef<HTMLDivElement | null>(null);
  const layersRef = useRef<HTMLDivElement | null>(null);
  const stylesRef = useRef<HTMLDivElement | null>(null);
  const traitsRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const pageSetupRef = useRef<PageSetup>(initialPageSetup);
  const syncTimerRef = useRef<number | null>(null);
  const isBootstrappingRef = useRef(false);
  const lastTemplateIdRef = useRef<string | null>(null);
  const latestTemplateRef = useRef({
    html: template?.html ?? '',
    builderState: template?.builderState ?? null,
  });
  const bootstrapStateRef = useRef({
    projectData: builderState.projectData,
    html: template?.html ?? '',
    pageSetup: initialPageSetup,
  });

  const persistEditorState = useCallback(
    (currentEditor: Editor | null = editorRef.current) => {
      if (!currentEditor) {
        return;
      }

      const html = buildPersistedCoverPageHtml({
        html: currentEditor.getHtml(),
        css: currentEditor.getCss(),
        pageSetup: pageSetupRef.current,
      });
      const serializedState = serializeCoverPageBuilderState(
        currentEditor.getProjectData(),
        pageSetupRef.current
      );

      if (
        latestTemplateRef.current.html === html &&
        latestTemplateRef.current.builderState === serializedState
      ) {
        return;
      }

      latestTemplateRef.current = {
        html,
        builderState: serializedState,
      };

      dispatch(setCoverPageHtml({ type, html }));
      dispatch(
        setCoverPageBuilderState({
          type,
          builderState: serializedState,
        })
      );
    },
    [dispatch, type]
  );

  useEffect(() => {
    pageSetupRef.current = pageSetup;
  }, [pageSetup]);

  useEffect(() => {
    latestTemplateRef.current = {
      html: template?.html ?? '',
      builderState: template?.builderState ?? null,
    };
  }, [template?.builderState, template?.html]);

  useEffect(() => {
    bootstrapStateRef.current = {
      projectData: builderState.projectData,
      html: template?.html ?? '',
      pageSetup: initialPageSetup,
    };
  }, [builderState.projectData, initialPageSetup, template?.html]);

  useEffect(() => {
    if (!template?.id || lastTemplateIdRef.current === template.id) {
      return;
    }

    lastTemplateIdRef.current = template.id;

    const nextPageSetup =
      builderState.pageSetup ?? htmlPageSetup ?? DEFAULT_PAGE_SETUP;

    pageSetupRef.current = nextPageSetup;
    setPageSetup(nextPageSetup);
    setLeftPanel('blocks');
    setRightPanel('styles');
  }, [builderState.pageSetup, htmlPageSetup, template?.id]);

  useEffect(() => {
    const currentEditor = editorRef.current;
    if (!currentEditor || !isReady) {
      return;
    }

    const root = ensureCoverPageRoot(currentEditor, pageSetup);
    if (!root) {
      return;
    }

    persistEditorState(currentEditor);
  }, [isReady, pageSetup, persistEditorState]);

  useEffect(() => {
    if (
      !template?.id ||
      !canvasRef.current ||
      !blocksRef.current ||
      !layersRef.current ||
      !stylesRef.current ||
      !traitsRef.current
    ) {
      return;
    }

    const {
      projectData,
      html,
      pageSetup: bootstrapPageSetup,
    } = bootstrapStateRef.current;

    isBootstrappingRef.current = true;
    setIsReady(false);

    const editorInstance = grapesjs.init({
      container: canvasRef.current,
      fromElement: false,
      height: '100%',
      width: 'auto',
      storageManager: false,
      noticeOnUnload: false,
      selectorManager: {
        componentFirst: true,
      },
      panels: {
        defaults: [],
      },
      blockManager: {
        appendTo: blocksRef.current,
      },
      layerManager: {
        appendTo: layersRef.current,
      },
      styleManager: {
        appendTo: stylesRef.current,
        sectors: STYLE_MANAGER_SECTORS,
      },
      traitManager: {
        appendTo: traitsRef.current,
      },
      deviceManager: {
        devices: [],
      },
      assetManager: {
        upload: false,
        assets: [],
      },
      canvas: {
        frameStyle: CANVAS_FRAME_STYLES,
      },
    });

    editorRef.current = editorInstance;
    setEditor(editorInstance);
    registerCoverPageBlocks(editorInstance);

    const schedulePersist = () => {
      if (isBootstrappingRef.current) {
        return;
      }

      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
      }

      syncTimerRef.current = window.setTimeout(() => {
        persistEditorState(editorInstance);
      }, 180);
    };

    editorInstance.on('update', schedulePersist);

    if (projectData) {
      editorInstance.loadProjectData(projectData);
    } else if (html.trim()) {
      editorInstance.setComponents(
        normalizeCoverPageCanvasHtml(html, bootstrapPageSetup)
      );
    } else {
      editorInstance.setComponents(
        createDefaultCoverPageHtml(bootstrapPageSetup)
      );
    }

    ensureCoverPageRoot(editorInstance, bootstrapPageSetup);
    isBootstrappingRef.current = false;
    setIsReady(true);
    persistEditorState(editorInstance);

    return () => {
      isBootstrappingRef.current = true;

      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }

      persistEditorState(editorInstance);
      editorInstance.destroy();
      editorRef.current = null;
      setEditor(null);
      setIsReady(false);
    };
  }, [persistEditorState, template?.id, type]);

  useEffect(() => {
    if (!editor || !isReady) return;

    const updateZoom = () => {
      const width = window.innerWidth;
      let zoom = 100;
      if (width < 1440) zoom = 90;
      if (width < 1280) zoom = 80;
      if (width < 1024) zoom = 70;
      editor.Canvas.setZoom(zoom);
    };

    updateZoom(); // apply on mount
    window.addEventListener('resize', updateZoom);
    return () => window.removeEventListener('resize', updateZoom);
  }, [editor, isReady]);

  return {
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
  };
};
