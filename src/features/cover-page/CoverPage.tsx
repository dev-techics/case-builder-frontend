import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/features/cover-page/components/accordion';
import { Edit } from 'lucide-react';
import {
  setEnabled,
  setTemplate,
  setIsEditing,
  upsertTemplate,
  saveCoverPageIdInMetadata,
  removeCoverPageIdFromMetadata,
  saveCoverPageData,
} from './redux/coverPageSlice';
import LexicalCoverPageEditor from './components/LexicalCoverPageEditor';
import TemplateSelectionDialog from './components/TemplateSelectionDialog';

interface CoverPageProps {
  type: 'Front' | 'Back';
}

const CoverPage = ({ type }: CoverPageProps) => {
  const dispatch = useAppDispatch();
  const {
    frontEnabled,
    backEnabled,
    frontTemplateKey,
    backTemplateKey,
    isSaving,
    templates,
  } = useAppSelector(state => state.coverPage);

  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [accordionValue, setAccordionValue] = useState<string | undefined>(
    undefined
  );

  const isEnabled = type === 'Front' ? frontEnabled : backEnabled;
  const templateKey = type === 'Front' ? frontTemplateKey : backTemplateKey;
  const selectedTemplate = templates.find(t => t.templateKey === templateKey);

  useEffect(() => {
    setAccordionValue(isEnabled ? 'cover-page' : undefined);
  }, [isEnabled]);

  const handleEnableToggle = async (enabled: boolean) => {
    const coverType = type.toLowerCase() as 'front' | 'back';

    dispatch(setEnabled({ type: coverType, enabled }));

    if (!enabled) {
      // Remove cover page ID from metadata when disabling
      await dispatch(removeCoverPageIdFromMetadata(coverType)).unwrap();
    }
  };

  /*--------------------------------------------------
    Select template and save the id in bundle metadata
   ---------------------------------------------------*/
  const handleSelectTemplate = async (id: string, key: string) => {
    const coverType = type.toLowerCase() as 'front' | 'back';
    dispatch(setTemplate({ type: coverType, templateKey: key }));

    await dispatch(
      saveCoverPageIdInMetadata({
        type: coverType,
        coverPageId: id,
      })
    ).unwrap();

    setShowTemplateDialog(false);
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

  const handleCloseEditor = () => {
    setShowEditor(false);
    dispatch(setIsEditing(false));
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
      {/*----------------------
        Cover Page Accordion
      -----------------------*/}
      <Accordion
        type="single"
        collapsible
        className="w-full"
        value={accordionValue}
        onValueChange={value => setAccordionValue(value || undefined)}
      >
        <AccordionItem
          value="cover-page"
          className="border rounded-lg bg-white"
        >
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center justify-between w-full pr-2">
              <span className="font-semibold text-sm">{type} Cover Page</span>
              <label
                className="relative inline-flex cursor-pointer items-center"
                onClick={e => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={isEnabled}
                  onChange={e => handleEnableToggle(e.target.checked)}
                  disabled={isSaving}
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
              </label>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
              {/* Template Selection */}
              <div className="flex items-center justify-between py-2">
                <div className="flex-1">
                  {selectedTemplate ? (
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {selectedTemplate.name}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {selectedTemplate.description}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No page selected</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowTemplateDialog(true)}
                  disabled={!isEnabled}
                >
                  {selectedTemplate ? 'Change' : 'Select'}
                </Button>
              </div>

              {/* Edit Button */}
              {selectedTemplate && (
                <Button
                  className="w-full"
                  variant="default"
                  onClick={handleOpenEditor}
                  disabled={!isEnabled}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Cover Page
                </Button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

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
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="flex flex-col max-h-[90vh] max-w-9xl h-screen p-0 overflow-hidden">
          <DialogHeader className="border-b p-6 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle>Edit {type} Cover Page</DialogTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCloseEditor}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden px-4 py-2">
            <LexicalCoverPageEditor
              type={type.toLowerCase() as 'front' | 'back'}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CoverPage;
