import { ChevronDownIcon, File, Folder } from "lucide-react";

export default function header() {
    return (
        <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
                <ChevronDownIcon size={20} />
                <p>case-1</p>
            </div>
            <div className="flex gap-2">
                <File size={20} />
                <Folder size={20} />
            </div>
        </div>
    );
}
