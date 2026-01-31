import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText, Edit, Save, X } from 'lucide-react';
import {
  setEnabled,
  setTemplate,
  setIsEditing,
  saveCoverPageIdInMetadata,
  saveCoverPageData,
} from '../redux/coverPageSlice';
import CoverPageEditor from './CoverPageEditor';
import TemplateSelectionDialog from './TemplateSelectionDialog';

const CoverPageManager = () => {
  const dispatch = useAppDispatch();
  const { enabled, templateKey, isSaving, templates } = useAppSelector(
    state => state.coverPage
  );

  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const selectedTemplate = templates.find(t => t.template_key === templateKey);

  const handleEnableToggle = () => {
    const newEnabledState = !enabled;
    dispatch(setEnabled(newEnabledState));
    if (newEnabledState) {
      dispatch(saveCoverPageIdInMetadata(templateKey));
    }
  };

  const handleSelectTemplate = (key: string) => {
    dispatch(setTemplate(key));
    setShowTemplateDialog(false);
    dispatch(saveCoverPageIdInMetadata(key));
  };

  const handleOpenEditor = () => {
    setShowEditor(true);
    dispatch(setIsEditing(true));
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    dispatch(setIsEditing(false));
  };

  const handleSave = async () => {
    try {
      // First save the cover page data (creates/updates the cover page)
      const result = await dispatch(saveCoverPageData()).unwrap();

      // Then save the cover page ID in the bundle metadata
      if (result?.id) {
        await dispatch(saveCoverPageIdInMetadata(result.id)).unwrap();
      }

      handleCloseEditor();
    } catch (error) {
      console.error('Failed to save cover page:', error);
      // You could add toast notification here
    }
  };
  return (
    <div className="space-y-4">
      {/* Cover Page Toggle */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-gray-600" />
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Cover Page
              </h3>
              <p className="text-gray-500 text-xs">
                Add a professional cover to your export
              </p>
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={enabled}
              onChange={handleEnableToggle}
              disabled={isSaving}
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
          </label>
        </div>

        {enabled && selectedTemplate && (
          <div className="mt-4 space-y-3">
            {/* Current Template */}
            <div className="rounded-md bg-gray-50 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {selectedTemplate.name}
                  </p>
                  <p className="mt-1 text-gray-600 text-xs">
                    {selectedTemplate.description}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowTemplateDialog(true)}
                >
                  Change
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="default"
                onClick={handleOpenEditor}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Cover Page
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Template Selection Dialog */}
      <TemplateSelectionDialog
        open={showTemplateDialog}
        onOpen={setShowTemplateDialog}
        onSelect={handleSelectTemplate}
      />

      {/* Cover Page Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="flex flex-col max-h-[90vh] max-w-5xl p-0 overflow-hidden">
          <DialogHeader className="border-b p-6 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle>Edit Cover Page</DialogTitle>
              <div className="flex gap-2 pr-4">
                <Button variant="outline" onClick={handleCloseEditor}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden px-4 py-2">
            <CoverPageEditor />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoverPageManager;
