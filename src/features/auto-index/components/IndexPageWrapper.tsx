import { FileText } from "lucide-react";
import { IndexPDFPreview } from "./IndexPDFPreview";

type IndexPageWrapperProps = {
    scale?: number;
};

export function IndexPageWrapper({ scale = 1 }: IndexPageWrapperProps) {
    return (
        <div className="overflow-hidden rounded-lg bg-white shadow-lg">
            {/* Index Header */}
            <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-gray-700">
                        Table of Contents
                    </span>
                    <span className="text-gray-400 text-sm">
                        (Auto-generated)
                    </span>
                </div>
            </div>

            {/* Index Preview */}
            <div className="flex flex-col items-center p-4">
                <IndexPDFPreview scale={scale} />
            </div>
        </div>
    );
}