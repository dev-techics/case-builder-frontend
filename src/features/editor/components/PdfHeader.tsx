import DeleteAlertDialog from '@/features/file-explorer/components/DeleteAlertDialog';
import { FileText, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { editorApi } from '../api';

const PdfHeader = ({ file }: any) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const handleFileDelete = async () => {
    try {
      await editorApi.deleteDocument(file.id);
      console.log('File deleted successfully');
    } catch (err: any) {
      console.log(err);
    }
  };
  return (
    <>
      <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-red-500" />
          <span className="font-medium text-gray-700">{file.name}</span>
        </div>

        <button
          onClick={() => setShowDeleteDialog(true)}
          className="rounded p-1 hover:bg-gray-200"
          type="button"
        >
          <Trash2 className="h-4 w-4 text-gray-500" />
        </button>
      </div>
      <DeleteAlertDialog
        open={showDeleteDialog}
        onOpen={setShowDeleteDialog}
        onDelete={handleFileDelete}
        file={file.name}
      />
    </>
  );
};

export default PdfHeader;
