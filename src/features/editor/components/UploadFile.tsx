import { Upload } from 'lucide-react';

function UploadFile() {
  /*--------------------------------------------------------
        File Upload Handler
        Just logs files for now — you can later 
        connect this to your backend or state to add new PDFs.
        ------------------------------------------------------*/

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    // Handle file upload logic here
    console.log('Files to upload:', files);
  };
  return (
    <div className="flex h-full items-center justify-center bg-gray-50">
      <div className="text-center">
        <Upload className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <p className="mb-2 font-medium text-gray-600 text-lg">
          No documents yet
        </p>
        <p className="mb-4 text-gray-400 text-sm">
          Upload PDF files to get started
        </p>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          <Upload className="h-4 w-4" />
          Upload PDFs
          <input
            accept=".pdf"
            className="hidden"
            multiple
            onChange={handleFileUpload}
            type="file"
          />
        </label>
      </div>
    </div>
  );
}

export default UploadFile;
