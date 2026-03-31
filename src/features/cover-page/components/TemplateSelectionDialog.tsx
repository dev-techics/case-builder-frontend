import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Trash2 } from 'lucide-react';
import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import type { CoverPageTemplate, CoverPageType } from '../types';
import { clearCoverPageTemplate } from '../redux/coverPageSlice';
import { selectCoverPageByType } from '../redux/selectors';
import {
  useDeleteCoverPageMutation,
  useGetTemplatesQuery,
  useUpdateBundleMetadataMutation,
} from '../api';
import { buildCoverPageBundleMetadata, isPersistedBundleId } from '../utils';

interface TemplateSelectionDialogProps {
  open: boolean;
  onOpen: (open: boolean) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  type: CoverPageType;
}

const TemplateSelectionDialog = ({
  open,
  onOpen,
  onSelect,
  onCreate,
  type,
}: TemplateSelectionDialogProps) => {
  const dispatch = useAppDispatch();

  const { data, isLoading, isError } = useGetTemplatesQuery(undefined, {
    skip: !open,
  });
  const [deleteCoverPage, { isLoading: isDeleting }] =
    useDeleteCoverPageMutation();
  const [updateBundleMetadata] = useUpdateBundleMetadataMutation();
  const templates = data ?? [];
  const selectedTemplate = useAppSelector(state =>
    selectCoverPageByType(state, type)
  );
  const currentBundleId = useAppSelector(
    state => state.coverPage.currentBundleId
  );

  const [deleteTarget, setDeleteTarget] = useState<CoverPageTemplate | null>(
    null
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const filteredTemplates = templates.filter(
    template => template.type === type
  );
  const selectedId = selectedTemplate?.id;

  const handleRequestDelete = (
    event: MouseEvent<HTMLButtonElement>,
    template: CoverPageTemplate
  ) => {
    event.stopPropagation();
    setDeleteTarget(template);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    try {
      await deleteCoverPage(deleteTarget.id).unwrap();

      if (selectedId === deleteTarget.id) {
        dispatch(clearCoverPageTemplate(type));

        if (isPersistedBundleId(currentBundleId)) {
          await updateBundleMetadata({
            bundleId: currentBundleId,
            metadata: buildCoverPageBundleMetadata(type, null),
          }).unwrap();
        }
      }
    } catch (error) {
      console.error('Failed to delete cover page:', error);
    } finally {
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    }
  };

  const handleTemplateKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    id: string
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent className="max-w-6xl md:max-w-4xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose {type} Cover Page Template</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 md:grid-cols-3 sm:grid-cols-2">
          <button
            className="group rounded-lg border-2 border-dashed border-gray-300 p-4 text-left transition-all hover:border-blue-500 hover:bg-blue-50"
            onClick={onCreate}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">
                Create New
              </h3>
              <div className="rounded-full bg-blue-500 px-2 py-1 font-medium text-white text-xs">
                New
              </div>
            </div>
            <p className="text-gray-600 text-xs">
              Start from a blank {type} cover page.
            </p>
          </button>

          {isLoading ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 text-sm">Loading templates...</p>
            </div>
          ) : isError ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 text-sm">Failed to load templates.</p>
            </div>
          ) : filteredTemplates.length > 0 ? (
            filteredTemplates.map(template => (
              <div
                key={template.id}
                role="button"
                tabIndex={0}
                className={`group relative rounded-lg border-2 p-4 text-left transition-all hover:border-blue-500 hover:bg-blue-50 ${
                  template.id === selectedId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
                onClick={() => onSelect(template.id)}
                onKeyDown={event => handleTemplateKeyDown(event, template.id)}
              >
                {template.id && (
                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded-md p-1 text-gray-400 transition hover:bg-white hover:text-red-600"
                    onClick={event => handleRequestDelete(event, template)}
                    aria-label={`Delete ${template.name}`}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}

                <div className="mb-2 flex items-center justify-between pr-6">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {template.name}
                  </h3>
                  {template.id === selectedId && (
                    <div className="rounded-full bg-blue-500 px-2 py-1 font-medium text-white text-xs">
                      Active
                    </div>
                  )}
                </div>
                <p className="text-gray-600 text-xs">{template.description}</p>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 text-sm">
                No {type} cover page templates available
              </p>
            </div>
          )}
        </div>
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Cover Page</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{deleteTarget?.name}
                &quot;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateSelectionDialog;
