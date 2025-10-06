import { FileText } from "lucide-react";

export default function ErrorComp({ error, file }) {
    return (
        <div className="flex h-96 items-center justify-center rounded border-2 border-red-200 bg-red-50">
            <div className="max-w-md px-4 text-center">
                <FileText className="mx-auto mb-2 h-12 w-12 text-red-300" />
                <p className="font-medium text-red-600">Failed to load PDF</p>
                {error && (
                    <p className="mt-2 text-red-500 text-sm">
                        {error.message}
                    </p>
                )}
                <p className="mt-3 text-gray-500 text-xs">
                    Check browser console for details
                </p>
            </div>
        </div>
    )
}
