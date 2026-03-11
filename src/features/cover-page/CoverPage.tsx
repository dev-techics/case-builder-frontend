import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import {
  setTemplate,
  setIsEditing,
  upsertTemplate,
  saveCoverPageData,
  deSelectCoverPage,
} from './redux/coverPageSlice';
import LexicalCoverPageEditor from './components/LexicalCoverPageEditor';
import TemplateSelectionDialog from './components/TemplateSelectionDialog';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Edit03Icon,
  RemoveCircleIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons';
import { useLazyGetTemplateQuery } from './api';
import { useNavigate } from 'react-router-dom';

interface CoverPageProps {
  type: 'Front' | 'Back';
}

const CoverPage = ({ type }: CoverPageProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [fetchTemplateById] = useLazyGetTemplateQuery();
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const { frontCoverPage, backCoverPage } = useAppSelector(
    state => state.coverPage
  );
  /*--------------------------------------------------
    Select template and save the id in bundle metadata 
    and also save in the local state
   ---------------------------------------------------*/
  const handleSelectTemplate = async (id: string) => {
    const coverType = type.toLowerCase() as 'front' | 'back';
    try {
      const template = await fetchTemplateById(id).unwrap();
      dispatch(setTemplate({ template }));

      setShowTemplateDialog(false);
    } catch (error) {
      console.error('Failed to load cover page template:', error);
    }
  };

  const handleCreateTemplate = () => {
    const coverType = type.toLowerCase() as 'front' | 'back';
    const templateKey = `custom_${coverType}_${Date.now()}`;

    dispatch(
      upsertTemplate({
        templateKey,
        name: `Custom ${type} Cover Page`,
        description: 'Custom template',
        type: coverType,
        html: '',
        lexicalJson: null,
      })
    );

    dispatch(setTemplate({ type: coverType, templateKey }));
    setShowTemplateDialog(false);
    setShowEditor(true);
    dispatch(setIsEditing(true));
  };

  const handleOpenEditor = () => {
    setShowEditor(true);
    dispatch(setIsEditing(true));
  };

  const handleSave = async () => {
    try {
      const coverType = type.toLowerCase() as 'front' | 'back';

      // First save the cover page data (creates/updates the cover page)
      const result = await dispatch(saveCoverPageData(coverType)).unwrap();
      console.log(result);
      // Then save the cover page ID in the bundle metadata
      const coverPageId = result?.response?.id;
      if (coverPageId) {
        await dispatch(
          saveCoverPageIdInMetadata({
            type: coverType,
            coverPageId,
          })
        ).unwrap();
      } else {
        console.warn('Cover page saved without an id in the response.', result);
      }

      handleCloseEditor();
    } catch (error) {
      console.error('Failed to save cover page:', error);
      // You could add toast notification here
    }
  };

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
            {type === 'Front' && frontCoverPage
              ? frontCoverPage.name
              : type === 'Back' && backCoverPage
                ? backCoverPage.name
                : 'Not Selected'}
          </p>
          <div className="min-h-5 min-w-5">
            {/*--------------------------------- 
              Select Cover page If not selected
            ------------------------------------*/}
            {type === 'Front' && !frontCoverPage ? (
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
                >
                  <HugeiconsIcon className="h-5 w-5" icon={ViewIcon} />
                </span>
                <span
                  title="Edit"
                  className=" hover:bg-gray-300 p-1 rounded-full cursor-pointer"
                  onClick={() =>
                    navigate(
                      `/cover-page-editor/${type === 'Front' ? frontCoverPage?.id : backCoverPage?.id}`
                    )
                  }
                >
                  <HugeiconsIcon className="h-4 w-4" icon={Edit03Icon} />
                </span>
                <span
                  title="Remove"
                  className=" hover:bg-gray-300 rounded-full cursor-pointer p-1"
                  onClick={() => dispatch(deSelectCoverPage(type))}
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

      {/*--------------------------------- 
        Cover Page Editor Dialog (Lexical) 
        ----------------------------------*/}
    </>
  );
};

export default CoverPage;
