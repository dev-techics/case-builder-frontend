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
import type { Template } from '../types';
import { deleteCoverPage } from '../redux/coverPageSlice';

interface TemplateSelectionDialogProps {
  open: boolean;
  onOpen: (open: boolean) => void;
  onSelect: (id: string, key: string) => void;
  onCreate: () => void;
  type: 'Front' | 'Back';
}

const TemplateSelectionDialog = ({
  open,
  onOpen,
  onSelect,
  onCreate,
  type,
}: TemplateSelectionDialogProps) => {
  const dispatch = useAppDispatch();
  const { frontTemplateKey, backTemplateKey } = useAppSelector(
    state => state.coverPage
  );
  const templates = useAppSelector(state => state.coverPage.templates);
  const isSaving = useAppSelector(state => state.coverPage.isSaving);

  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const currentTemplateKey =
    type === 'Front' ? frontTemplateKey : backTemplateKey;

  // Filter templates based on type
  const filteredTemplates = templates.filter(template => {
    // Assuming templates have a 'type' property that matches 'front' or 'back'
    // If your template structure is different, adjust this filter accordingly
    return template.type === type.toLowerCase();
  });

  const handleSelectTemplate = (id: string, key: string) => {
    onSelect(id, key);
  };

  const handleRequestDelete = (
    event: MouseEvent<HTMLButtonElement>,
    template: Template
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
      await dispatch(deleteCoverPage({ id: deleteTarget.id })).unwrap();
    } catch (error) {
      console.error('Failed to delete cover page:', error);
    } finally {
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    }
  };

  const handleTemplateKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    id: string,
    key: string
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelectTemplate(id, key);
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
              Start from a blank {type.toLowerCase()} cover page.
            </p>
          </button>

          {filteredTemplates.length > 0 ? (
            filteredTemplates.map(template => (
              <div
                key={template.id || template.templateKey}
                role="button"
                tabIndex={0}
                className={`group relative rounded-lg border-2 p-4 text-left transition-all hover:border-blue-500 hover:bg-blue-50 ${
                  template.templateKey === currentTemplateKey
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
                onClick={() =>
                  handleSelectTemplate(template.id, template.templateKey)
                }
                onKeyDown={event =>
                  handleTemplateKeyDown(
                    event,
                    template.id,
                    template.templateKey
                  )
                }
              >
                {template.id && (
                <button
                  type="button"
                  className="absolute right-2 top-2 rounded-md p-1 text-gray-400 transition hover:bg-white hover:text-red-600"
                  onClick={event => handleRequestDelete(event, template)}
                  aria-label={`Delete ${template.name}`}
                  disabled={isSaving}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                )}

                <div className="mb-2 flex items-center justify-between pr-6">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {template.name}
                  </h3>
                  {template.templateKey === currentTemplateKey && (
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
                No {type.toLowerCase()} cover page templates available
              </p>
            </div>
          )}
        </div>
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Cover Page</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteTarget?.name}"? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={isSaving}
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
