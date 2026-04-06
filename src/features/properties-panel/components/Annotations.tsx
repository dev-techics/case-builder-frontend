import { useAppSelector } from '@/app/hooks';
import AnnotationsForm from './AnnotationsForm';

const Annotations = () => {
  const { headerLeft, headerRight, footer } = useAppSelector(
    states => states.propertiesPanel.headersFooter
  );
  const { currentBundleId, isSaving, lastSaved } = useAppSelector(
    states => states.propertiesPanel
  );

  const initialAnnotations = {
    headerLeft: headerLeft.text || '',
    headerRight: headerRight.text || '',
    footer: footer.text || '',
  };

  const formKey = [
    currentBundleId ?? 'no-bundle',
    initialAnnotations.headerLeft,
    initialAnnotations.headerRight,
    initialAnnotations.footer,
  ].join('::');

  return (
    <AnnotationsForm
      currentBundleId={currentBundleId}
      initialAnnotations={initialAnnotations}
      isSaving={isSaving}
      key={formKey}
      lastSaved={lastSaved}
    />
  );
};

export default Annotations;
