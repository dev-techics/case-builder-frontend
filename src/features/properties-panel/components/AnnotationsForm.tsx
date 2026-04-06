import { Copy, RotateCcw, Save, Check } from 'lucide-react';
import { useState } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { updateAnnotations } from '../redux/propertiesPanelSlice';
import { usePersistMetadata } from '../hooks';

type AnnotationField = 'headerLeft' | 'headerRight' | 'footer';

export type AnnotationValues = {
  headerLeft: string;
  headerRight: string;
  footer: string;
};

type AnnotationsFormProps = {
  currentBundleId: string | null;
  initialAnnotations: AnnotationValues;
  isSaving: boolean;
  lastSaved: string | null;
};

const AnnotationsForm = ({
  currentBundleId,
  initialAnnotations,
  isSaving,
  lastSaved,
}: AnnotationsFormProps) => {
  const dispatch = useAppDispatch();
  const { persistMetadata } = usePersistMetadata();

  const [annotations, setAnnotations] = useState(initialAnnotations);

  const handleReset = () => {
    setAnnotations({
      headerLeft: '',
      headerRight: '',
      footer: '',
    });
    dispatch(updateAnnotations({ type: 'reset' }));
  };

  const handleSave = () => {
    dispatch(updateAnnotations({ type: 'save', annotations }));
    void persistMetadata({
      bundleId: currentBundleId,
      headerLeftText: annotations.headerLeft,
      headerRightText: annotations.headerRight,
      footerText: annotations.footer,
    });
  };

  const handleCopyPreview = () => {
    const preview = `Header Left: ${annotations.headerLeft}\nHeader Right: ${annotations.headerRight}\nFooter: ${annotations.footer}`;
    navigator.clipboard.writeText(preview);
  };

  const handleBlur = (field: AnnotationField, value: string) => {
    // Update Redux state on blur so the PDF preview reflects the latest text
    dispatch(updateAnnotations({ annotation: { field, value }, type: 'blur' }));
  };

  const inputClass =
    'w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors';

  const labelClass = 'block text-xs font-semibold text-gray-700 mb-1.5';

  const sectionClass =
    'space-y-2 p-3 rounded-lg border border-gray-100 bg-gray-50 hover:border-gray-200 transition-colors';

  return (
    <div className="space-y-4">
      {lastSaved && (
        <div className="flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-xs text-green-700">
          <Check className="h-3.5 w-3.5" />
          <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
        </div>
      )}

      <div>
        <div className="mb-3 flex flex-col items-start justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">Page Headers</h3>
          <span className="text-gray-400 text-xs">
            Appears on top of each page
          </span>
        </div>

        <div className={sectionClass}>
          <div>
            <label className={labelClass} htmlFor="header-left">
              Left
            </label>
            <input
              className={inputClass}
              id="header-left"
              onChange={e =>
                setAnnotations(prev => ({
                  ...prev,
                  headerLeft: e.target.value,
                }))
              }
              onBlur={e => handleBlur('headerLeft', e.target.value)}
              placeholder="e.g., Company Name"
              type="text"
              value={annotations.headerLeft}
            />
          </div>
        </div>

        <div className={sectionClass}>
          <div>
            <label className={labelClass} htmlFor="header-right">
              Right
            </label>
            <input
              className={inputClass}
              id="header-right"
              onChange={e =>
                setAnnotations(prev => ({
                  ...prev,
                  headerRight: e.target.value,
                }))
              }
              onBlur={e => handleBlur('headerRight', e.target.value)}
              placeholder="e.g., Document Version"
              type="text"
              value={annotations.headerRight}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-col items-start justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">Page Footer</h3>
          <span className="text-gray-400 text-xs">
            Appears on bottom of each page
          </span>
        </div>

        <div className={sectionClass}>
          <div>
            <label className={labelClass} htmlFor="footer">
              Footer Text
            </label>
            <input
              className={inputClass}
              id="footer"
              onChange={e =>
                setAnnotations(prev => ({ ...prev, footer: e.target.value }))
              }
              onBlur={e => handleBlur('footer', e.target.value)}
              placeholder="e.g., Confidential"
              type="text"
              value={annotations.footer}
            />
            <p className="mt-1.5 text-gray-500 text-xs">
              💡 Tip: Page numbers are automatically added to the right
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
        <p className="mb-2 font-semibold text-blue-900 text-xs">Preview</p>
        <div className="space-y-1 rounded border border-blue-100 bg-white p-2 font-mono text-blue-800 text-xs">
          {(annotations.headerLeft || annotations.headerRight) && (
            <div className="flex justify-between">
              <span className="text-gray-600">← {annotations.headerLeft}</span>
              <span className="text-gray-600">{annotations.headerRight} →</span>
            </div>
          )}
          {!(annotations.headerLeft || annotations.headerRight) && (
            <div className="text-gray-400 italic">Headers will appear here</div>
          )}
          {annotations.footer && (
            <div className="mt-1 flex justify-between border-blue-100 border-t pt-1">
              <span className="text-gray-600">← {annotations.footer}</span>
              <span className="text-gray-600">Page # →</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={handleCopyPreview}
          size="sm"
          variant="outline"
        >
          <Copy className="mr-1.5 h-3.5 w-3.5" />
          Copy
        </Button>
        <Button
          className="flex-1"
          onClick={handleReset}
          size="sm"
          variant="outline"
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Reset
        </Button>
        <Button
          className="flex-1"
          disabled={isSaving || !currentBundleId}
          onClick={handleSave}
          size="sm"
          variant="default"
        >
          {isSaving ? (
            <>
              <div className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AnnotationsForm;
