import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Edit03Icon,
  RemoveCircleIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons';
import { useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import TemplateSelectionDialog from './components/TemplateSelectionDialog';
import CoverPagePreview from './components/preview/CoverPagePreview';
import { useCoverPageActions } from './hooks';
import { selectCoverPageByType } from './redux/selectors';
import type { CoverPageType } from './types';

interface CoverPageProps {
  type: CoverPageType;
}

const CoverPage = ({ type }: CoverPageProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();
  const {
    isTemplateDialogOpen: showTemplateDialog,
    setTemplateDialogOpen: setShowTemplateDialog,
    handleSelectTemplate,
    handleCreateTemplate,
    handleRemoveTemplate,
  } = useCoverPageActions(type);
  const selectedTemplate = useAppSelector(state =>
    selectCoverPageByType(state, type)
  );
  const selectedTemplateId = selectedTemplate?.id;
  const hasSelection = Boolean(selectedTemplateId);
  const displayName = selectedTemplate?.name.trim() || 'Not Selected';

  return (
    <>
      <div className="space-y-3">
        <h2>{type} cover page</h2>
        <div className="flex items-center justify-between gap-2 rounded-md border p-2">
          <p className="text-xs font-normal">{displayName}</p>
          <div className="min-h-5 min-w-5">
            {!hasSelection ? (
              <Button
                variant="ghost"
                size="sm"
                className="border shadow-sm text-xs font-normal"
                onClick={() => setShowTemplateDialog(true)}
              >
                Select
              </Button>
            ) : (
              /*--------------------------------
              Preview/Edit/Remove cover page  
            -----------------------------------*/

              <div className="flex justify-around items-center gap-2">
                <span
                  title="View"
                  className="hover:bg-gray-300 p-1 rounded-full cursor-pointer"
                  onClick={() => setShowPreview(true)}
                >
                  <HugeiconsIcon className="h-5 w-5" icon={ViewIcon} />
                </span>
                <span
                  title="Edit"
                  className="cursor-pointer rounded-full p-1 hover:bg-gray-300"
                  onClick={() => {
                    if (!selectedTemplateId) {
                      return;
                    }
                    navigate(`/cover-page-editor/${selectedTemplateId}`);
                  }}
                >
                  <HugeiconsIcon className="h-4 w-4" icon={Edit03Icon} />
                </span>
                <span
                  title="Remove"
                  className="cursor-pointer rounded-full p-1 hover:bg-gray-300"
                  onClick={handleRemoveTemplate}
                >
                  <HugeiconsIcon
                    className="h-4 w-4 text-red-500"
                    icon={RemoveCircleIcon}
                  />
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <TemplateSelectionDialog
        open={showTemplateDialog}
        onOpen={setShowTemplateDialog}
        onSelect={handleSelectTemplate}
        onCreate={handleCreateTemplate}
        type={type}
      />

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent>
          <CoverPagePreview type={type} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CoverPage;
