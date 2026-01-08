// src/features/editor/Editor.tsx
import { FileText, Trash2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import IndexPageWrapper from '../auto-index/components/IndexPageWrapper';
import { TextHighlightableDocument } from './components/Document';
import UploadFile from './components/UploadFile';
import { loadComments } from '../toolbar/toolbarSlice';
import { DocumentApiService } from '@/api/axiosInstance';
import {
  loadMetadataFromBackend,
  setCurrentBundleId,
} from '../properties-panel/propertiesPanelSlice';

const PDFViewer: React.FC = () => {
  const dispatch = useAppDispatch();
  const tree = useAppSelector(state => state.fileTree.tree);
  const selectedFile = useAppSelector(state => state.fileTree.selectedFile);

  // Subscribe to header/footer state
  // const headersFooter = useAppSelector(
  //   state => state.propertiesPanel.headersFooter
  // );
  const lastSaved = useAppSelector(state => state.propertiesPanel.lastSaved);

  /* Load comments for the current bundle */
  useEffect(() => {
    dispatch(loadComments({ bundleId: tree.id.split('-')[1] }));
  }, [dispatch, tree.id]);

  // Inside your component
  useEffect(() => {
    const bundleId = tree.id.split('-')[1];
    if (bundleId) {
      dispatch(setCurrentBundleId(bundleId));
      dispatch(loadMetadataFromBackend(bundleId));
    }
  }, [tree.id, dispatch]);

  // Find the selected file in the tree
  const findSelectedFile = (children: any[]): any => {
    for (const child of children) {
      if (child.id === selectedFile && child.type === 'file') {
        return child;
      }
      if (child.children) {
        const found = findSelectedFile(child.children);
        if (found) return found;
      }
    }
    return null;
  };

  const currentFile = selectedFile ? findSelectedFile(tree.children) : null;

  const fileWithUrl = useMemo(() => {
    if (!currentFile) return null;

    // Create cache-busting parameter based on metadata changes
    const cacheBuster = lastSaved || Date.now();
    const baseUrl = DocumentApiService.getDocumentStreamUrl(currentFile.id);

    return {
      ...currentFile,
      url: `${baseUrl}?v=${cacheBuster}`,
    };
  }, [
    currentFile?.id,
    currentFile?.name,
    lastSaved, // This will change when metadata is saved
    // Or use the actual metadata values:
    // headersFooter.headerLeft.text,
    // headersFooter.headerRight.text,
    // headersFooter.footer.text,
  ]);

  /*----------------------------
      Empty State
  ------------------------------*/
  if (tree.children.length === 0) {
    return <UploadFile />;
  }

  // No file selected
  if (!fileWithUrl) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100">
        <div className="text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <p className="text-gray-600 text-xl font-medium">
            Select a PDF to view
          </p>
          <p className="mt-2 text-gray-400 text-sm">
            Choose a file from the sidebar to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* PDF Document Container */}
      <div className="pdf-viewer-container flex-1 overflow-y-auto bg-gray-100 p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <IndexPageWrapper />
          <div
            className="rounded-lg bg-white shadow-lg"
            data-file-id={fileWithUrl.id}
          >
            {/* PDF Header */}
            <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-500" />
                <span className="font-medium text-gray-700">
                  {fileWithUrl.name}
                </span>
              </div>

              <button
                aria-label={`Delete ${fileWithUrl.name}`}
                className="rounded p-1 hover:bg-gray-200"
                onClick={() => console.log('Delete', fileWithUrl.id)}
                type="button"
              >
                <Trash2 className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* PDF Content Area */}
            <div className="flex flex-col items-center p-4">
              <TextHighlightableDocument file={fileWithUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
