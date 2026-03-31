import GrapesCoverPageEditor from './GrapesCoverPageEditor';
import CoverPageEditorHeader from './CoverPageEditorHeader';
import { useCoverPageEditor } from '../../hooks';

const EDITOR_STATE_MESSAGES = {
  'missing-id': 'Missing cover page id.',
  'draft-missing': 'Draft cover page not found.',
  loading: 'Loading cover page...',
  error: 'Unable to load cover page.',
} as const;

const EditorState = ({
  message,
}: {
  message: (typeof EDITOR_STATE_MESSAGES)[keyof typeof EDITOR_STATE_MESSAGES];
}) => (
  <div className="flex h-full items-center justify-center text-gray-500">
    {message}
  </div>
);

export const CoverPageEditor = () => {
  const {
    template,
    isSaving,
    loadState,
    handleCancel,
    handleNameChange,
    handleSave,
  } = useCoverPageEditor();

  if (loadState !== 'ready' || !template) {
    const message =
      loadState === 'ready'
        ? EDITOR_STATE_MESSAGES.error
        : EDITOR_STATE_MESSAGES[loadState];

    return <EditorState message={message} />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-100">
      <CoverPageEditorHeader
        name={template.name}
        type={template.type}
        isSaving={isSaving}
        onNameChange={handleNameChange}
        onCancel={handleCancel}
        onSave={handleSave}
      />
      <div className="flex-1 min-h-0 overflow-hidden px-4 py-4">
        <GrapesCoverPageEditor type={template.type} />
      </div>
    </div>
  );
};
