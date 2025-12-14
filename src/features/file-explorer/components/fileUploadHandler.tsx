import { FileUpIcon } from 'lucide-react';
import type React from 'react';
import { useAppDispatch } from '../../../app/hooks';
import { addFiles } from '../../file-explorer/fileTreeSlice';
import type { FileNode } from '../types';

const FileUploadHandler: React.FC = () => {
  const dispatch = useAppDispatch();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileNodes: FileNode[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate it's a PDF
      if (file.type !== 'application/pdf') {
        console.warn(`Skipping non-PDF file: ${file.name}`);
        continue;
      }

      // Create blob URL for PDF preview
      const url = URL.createObjectURL(file);
      console.log('✅ Created blob URL for:', file.name, url);

      // Don't store File object - it's non-serializable!
      const fileNode: FileNode = {
        id: `file-${Date.now()}-${i}`,
        name: file.name,
        type: 'file',
        url,
      };

      fileNodes.push(fileNode);
    }

    if (fileNodes.length > 0) {
      // Add files to Redux store
      dispatch(addFiles(fileNodes));
      console.log(`📁 Added ${fileNodes.length} file(s) to store`);
    }

    // Reset input
    e.target.value = '';
  };

  return (
    <div className="p-2 cursor-pointer">
      <label className="text-sm cursor-pointer hover:bg-gray-700">
        <FileUpIcon size={18} />
        <input
          accept=".pdf,application/pdf"
          className="hidden"
          multiple
          onChange={handleFileUpload}
          type="file"
        />
      </label>
    </div>
  );
};

export default FileUploadHandler;
