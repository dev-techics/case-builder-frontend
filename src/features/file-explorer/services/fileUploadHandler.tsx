import { Upload } from "lucide-react";
import type React from "react";
import { useAppDispatch } from "../../../app/hooks";
import { addFiles } from "../fileTreeSlice";
import type { FileNode } from "../types";

export const FileUploadHandler: React.FC = () => {
    const dispatch = useAppDispatch();

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const fileNodes: FileNode[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Create blob URL for PDF preview
            const url = URL.createObjectURL(file);

            const fileNode: FileNode = {
                id: `file-${Date.now()}-${i}`,
                name: file.name,
                type: "file",
                url,
                file,
            };

            fileNodes.push(fileNode);
        }

        // Add files to Redux store
        dispatch(addFiles(fileNodes));

        // Reset input
        e.target.value = "";
    };

    return (
        <div className="border-gray-700 border-b p-2">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
                <Upload className="h-4 w-4" />
                Upload PDFs
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
