import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Template } from '../../types';
import type { Dispatch, SetStateAction } from 'react';

interface CoverPageEditorHeaderProps {
  template: Template;
  handleNameChange: (value: string) => void;
  showPreview: boolean;
  setShowPreview: Dispatch<SetStateAction<boolean>>;
  handleCancel: () => void;
  handleSave: () => void;
  isSaving: boolean;
}

const CoverPageEditorHeader = ({
  template,
  handleNameChange,
  handleCancel,
  handleSave,
  isSaving,
}: CoverPageEditorHeaderProps) => {
  return (
    <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="hidden h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-xs font-semibold text-blue-600 sm:flex">
            A4
          </div>
          <div className="min-w-0 flex-1">
            <label className="sr-only" htmlFor="cover-page-editor-name">
              Cover page name
            </label>
            <Input
              id="cover-page-editor-name"
              value={template.name ?? ''}
              onChange={event => handleNameChange(event.target.value)}
              placeholder={`e.g., ${
                template.type === 'front' ? 'Main' : 'Back'
              } Cover Page`}
              className="h-9 max-w-[420px] text-sm font-semibold"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(prev => !prev)}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button> */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CoverPageEditorHeader;
