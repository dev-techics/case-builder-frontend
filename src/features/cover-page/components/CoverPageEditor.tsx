import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { setFieldValue } from '../redux/coverPageSlice';
import CoverPagePreview from './CoverPagePreview';

const CoverPageEditor = () => {
  const dispatch = useAppDispatch();
  const { templates, templateKey } = useAppSelector(state => state.coverPage);

  const template = templates.find(t => t.template_key === templateKey);
  console.log(template);

  if (!template) {
    return <div>Template not found</div>;
  }

  const handleFieldChange = (field: string, value: string) => {
    dispatch(setFieldValue({ field, value }));
  };

  // Group fields by their semantic purpose
  const getFieldLabel = (fieldName: string): string => {
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const isMultiline = (field: any): boolean => {
    return field.name.includes('title') || field.name.includes('case_title');
  };

  return (
    <div className="grid h-full min-h-0 gap-6 lg:grid-cols-2">
      {/* Left: Live Preview */}
      <div className="order-2 lg:order-1">
        <div className="sticky top-6">
          <h3 className="mb-3 font-semibold text-gray-900 text-sm">
            Live Preview
          </h3>
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <CoverPagePreview />
          </div>
          <p className="mt-2 text-gray-500 text-xs">
            This preview shows how your cover page will appear in the final PDF
          </p>
        </div>
      </div>

      {/* Right: Editable Fields */}
      <div className="min-h-0 overflow-y-auto pr-2 order-1 lg:order-2">
        <h3 className="mb-3 font-semibold text-gray-900 text-sm">
          Edit Fields
        </h3>
        <div className="space-y-4">
          {template.values.fields.map(field => (
            <div key={field.name}>
              <Label
                htmlFor={field.name}
                className="mb-1.5 block text-gray-700 text-sm"
              >
                {getFieldLabel(field.name)}
              </Label>
              {isMultiline(field) ? (
                <Textarea
                  id={field.name}
                  value={field.name || ''}
                  onChange={e => handleFieldChange(field.name, e.target.value)}
                  className="min-h-[80px] resize-none"
                  placeholder={`Enter ${getFieldLabel(field.name).toLowerCase()}`}
                />
              ) : (
                <Input
                  id={field.name}
                  type="text"
                  value={field.name || ''}
                  onChange={e => handleFieldChange(field.name, e.target.value)}
                  placeholder={`Enter ${getFieldLabel(field.name).toLowerCase()}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoverPageEditor;
