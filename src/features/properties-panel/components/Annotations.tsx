// src/features/properties-panel/components/Annotations.tsx
import { Copy, RotateCcw, Save, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import {
  changeFooter,
  changeHeaderLeft,
  changeHeaderRight,
  saveMetadataToBackend,
} from '../redux/propertiesPanelSlice';

const Annotations = () => {
  const dispatch = useAppDispatch();
  const { headerLeft, headerRight, footer } = useAppSelector(
    states => states.propertiesPanel.headersFooter
  );
  const { isSaving, lastSaved } = useAppSelector(
    states => states.propertiesPanel
  );

  // Local state for input fields
  const [localHeaderLeft, setLocalHeaderLeft] = useState(headerLeft.text || '');
  const [localHeaderRight, setLocalHeaderRight] = useState(
    headerRight.text || ''
  );
  const [localFooter, setLocalFooter] = useState(footer.text || '');

  // Sync local state with Redux state when it changes externally
  useEffect(() => {
    setLocalHeaderLeft(headerLeft.text || '');
  }, [headerLeft.text]);

  useEffect(() => {
    setLocalHeaderRight(headerRight.text || '');
  }, [headerRight.text]);

  useEffect(() => {
    setLocalFooter(footer.text || '');
  }, [footer.text]);

  const handleReset = () => {
    dispatch(changeHeaderLeft(''));
    dispatch(changeHeaderRight(''));
    dispatch(changeFooter(''));
    // Save to backend after reset
    setTimeout(() => {
      dispatch(saveMetadataToBackend());
    }, 100);
  };

  const handleSave = () => {
    dispatch(saveMetadataToBackend());
  };

  const handleCopyPreview = () => {
    const preview = `Header Left: ${localHeaderLeft}\nHeader Right: ${localHeaderRight}\nFooter: ${localFooter}`;
    navigator.clipboard.writeText(preview);
  };

  const handleBlur = (
    field: 'headerLeft' | 'headerRight' | 'footer',
    value: string
  ) => {
    // Update Redux state
    if (field === 'headerLeft') {
      dispatch(changeHeaderLeft(value));
    } else if (field === 'headerRight') {
      dispatch(changeHeaderRight(value));
    } else if (field === 'footer') {
      dispatch(changeFooter(value));
    }

    // Auto-save to backend after a short delay
    setTimeout(() => {
      dispatch(saveMetadataToBackend());
    }, 500);
  };

  const inputClass =
    'w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors';

  const labelClass = 'block text-xs font-semibold text-gray-700 mb-1.5';

  const sectionClass =
    'space-y-2 p-3 rounded-lg border border-gray-100 bg-gray-50 hover:border-gray-200 transition-colors';

  return (
    <div className="space-y-4">
      {/* Save Status */}
      {lastSaved && (
        <div className="flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-xs text-green-700">
          <Check className="h-3.5 w-3.5" />
          <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
        </div>
      )}

      {/* Header Section */}
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
              onChange={e => setLocalHeaderLeft(e.target.value)}
              onBlur={e => handleBlur('headerLeft', e.target.value)}
              placeholder="e.g., Company Name"
              type="text"
              value={localHeaderLeft}
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
              onChange={e => setLocalHeaderRight(e.target.value)}
              onBlur={e => handleBlur('headerRight', e.target.value)}
              placeholder="e.g., Document Version"
              type="text"
              value={localHeaderRight}
            />
          </div>
        </div>
      </div>

      {/* Footer Section */}
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
              onChange={e => setLocalFooter(e.target.value)}
              onBlur={e => handleBlur('footer', e.target.value)}
              placeholder="e.g., Confidential"
              type="text"
              value={localFooter}
            />
            <p className="mt-1.5 text-gray-500 text-xs">
              💡 Tip: Page numbers are automatically added to the right
            </p>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
        <p className="mb-2 font-semibold text-blue-900 text-xs">Preview</p>
        <div className="space-y-1 rounded border border-blue-100 bg-white p-2 font-mono text-blue-800 text-xs">
          {(localHeaderLeft || localHeaderRight) && (
            <div className="flex justify-between">
              <span className="text-gray-600">← {localHeaderLeft}</span>
              <span className="text-gray-600">{localHeaderRight} →</span>
            </div>
          )}
          {!(localHeaderLeft || localHeaderRight) && (
            <div className="text-gray-400 italic">Headers will appear here</div>
          )}
          {localFooter && (
            <div className="mt-1 flex justify-between border-blue-100 border-t pt-1">
              <span className="text-gray-600">← {localFooter}</span>
              <span className="text-gray-600">Page # →</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
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
          disabled={isSaving}
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

export default Annotations;
