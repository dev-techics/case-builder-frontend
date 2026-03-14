import { useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import TemplateSelectionDialog from './components/TemplateSelectionDialog';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Edit03Icon,
  RemoveCircleIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons';
import { useNavigate } from 'react-router-dom';
import { useCoverPageHandlers } from './hook';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import CoverPagePreview from './components/preview/CoverPagePreview';
import { useState } from 'react';

interface CoverPageProps {
  type: 'front' | 'back';
}

const CoverPage = ({ type }: CoverPageProps) => {
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const navigate = useNavigate();
  const {
    isTemplateDialogOpen: showTemplateDialog,
    setTemplateDialogOpen: setShowTemplateDialog,
    handleSelectTemplate,
    handleCreateTemplate,
    handleRemoveTemplate,
  } = useCoverPageHandlers(type);
  const { frontCoverPage, backCoverPage } = useAppSelector(
    state => state.coverPage
  );
  const selectedTemplateId =
    type === 'front' ? frontCoverPage?.id : backCoverPage?.id;
  const selectedTemplateName =
    type === 'front' ? frontCoverPage?.name : backCoverPage?.name;
  const hasSelection = Boolean(selectedTemplateId);
  const displayName = selectedTemplateName?.trim() || 'Not Selected';
  return (
    <>
      {/*-------------------------
        Cover Page Selection Card
      ----------------------------*/}
      <div className="space-y-3">
        {/* Template Selection */}
        <h2>{type} cover page</h2>
        <div className="flex gap-2 border rounded-md  p-2 justify-between items-center">
          <p className="text-xs font-normal">
            {/*---------------------------------- 
              Cover page name based on the type 
              -----------------------------------*/}
            {displayName}
          </p>
          <div className="min-h-5 min-w-5">
            {/*--------------------------------- 
              Select Cover page If not selected
            ------------------------------------*/}
            {!hasSelection ? (
              <Button
                variant={'ghost'}
                size={'sm'}
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
                  className=" hover:bg-gray-300 p-1 rounded-full cursor-pointer"
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
                  className=" hover:bg-gray-300 rounded-full cursor-pointer p-1"
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

      {/*--------------------------- 
        Template Selection Dialog 
        ---------------------------*/}
      <TemplateSelectionDialog
        open={showTemplateDialog}
        onOpen={setShowTemplateDialog}
        onSelect={handleSelectTemplate}
        onCreate={handleCreateTemplate}
        type={type}
      />

      {/*------------------------------ 
        View selected cover page dialog
      ---------------------------------*/}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent>
          <CoverPagePreview type={type} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CoverPage;
