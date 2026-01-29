import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppSelector } from '@/app/hooks';

interface TemplateSelectionDialogProps {
  open: boolean;
  onOpen: (open: boolean) => void;
  onSelect: (key: string) => void;
}

const TemplateSelectionDialog = ({
  open,
  onOpen,
  onSelect,
}: TemplateSelectionDialogProps) => {
  const { templateKey } = useAppSelector(state => state.coverPage);
  const templates = useAppSelector(state => state.coverPage.templates);

  const handleSelectTemplate = (key: string) => {
    onSelect(key);
  };
  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent className="max-w-6xl md:max-w-4xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose Cover Page Template</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 md:grid-cols-3 sm:grid-cols-2">
          {templates.map(template => (
            <button
              key={template.template_key}
              className={`group rounded-lg border-2 p-4 text-left transition-all hover:border-blue-500 hover:bg-blue-50 ${
                template.template_key === templateKey
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              }`}
              onClick={() => handleSelectTemplate(template.template_key)}
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {template.name}
                </h3>
                {template.template_key === templateKey && (
                  <div className="rounded-full bg-blue-500 px-2 py-1 font-medium text-white text-xs">
                    Active
                  </div>
                )}
              </div>
              <p className="text-gray-600 text-xs">{template.description}</p>
              <div className="mt-3 text-gray-500 text-xs">
                {template.values.fields.length} customizable fields
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateSelectionDialog;
