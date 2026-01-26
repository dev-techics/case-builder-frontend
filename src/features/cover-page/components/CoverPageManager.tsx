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
  saveCoverPageData,
} from '../redux/coverPageSlice';
import { COVER_TEMPLATES } from '../constants/coverTemplates';
import CoverPageEditor from './CoverPageEditor';

export default function CoverPageManager() {
  const dispatch = useAppDispatch();
  const { enabled, templateKey, isSaving } = useAppSelector(
    state => state.coverPage
  );

  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const selectedTemplate = COVER_TEMPLATES.find(t => t.key === templateKey);

  const handleEnableToggle = () => {
    dispatch(setEnabled(!enabled));
    if (!enabled) {
      dispatch(saveCoverPageData());
    }
  };

  const handleSelectTemplate = (key: string) => {
    dispatch(setTemplate(key));
    setShowTemplateDialog(false);
    dispatch(saveCoverPageData());
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
    await dispatch(saveCoverPageData());
    handleCloseEditor();
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
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose Cover Page Template</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            {COVER_TEMPLATES.map(template => (
              <button
                key={template.key}
                className={`group rounded-lg border-2 p-4 text-left transition-all hover:border-blue-500 hover:bg-blue-50 ${
                  template.key === templateKey
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
                onClick={() => handleSelectTemplate(template.key)}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {template.name}
                  </h3>
                  {template.key === templateKey && (
                    <div className="rounded-full bg-blue-500 px-2 py-1 font-medium text-white text-xs">
                      Active
                    </div>
                  )}
                </div>
                <p className="text-gray-600 text-xs">{template.description}</p>
                <div className="mt-3 text-gray-500 text-xs">
                  {template.fields.length} customizable fields
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cover Page Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden p-0">
          <DialogHeader className="border-b p-6 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle>Edit Cover Page</DialogTitle>
              <div className="flex gap-2">
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
          <div className="overflow-y-auto p-6">
            <CoverPageEditor />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
