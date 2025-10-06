import { ZoomIn, ZoomOut } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { zoomIn, zoomOut } from "../editorSlice";

function ZoomControls() {
    const disPatch = useDispatch();
    const scale = useSelector((state: any) => state.editor.scale);
    return (
        <div className="flex items-center justify-center gap-4 border-b bg-white p-4">
            <button
                aria-label="Zoom out"
                className="rounded p-2 hover:bg-gray-100"
                onClick={() => disPatch(zoomOut())}
                type="button"
            >
                <ZoomOut className="h-5 w-5" />
            </button>
            <span className="min-w-[60px] text-center font-medium text-sm">
                {Math.round(scale * 100)}%
            </span>
            <button
                aria-label="Zoom in"
                className="rounded p-2 hover:bg-gray-100"
                onClick={() => disPatch(zoomIn())}
                type="button"
            >
                <ZoomIn className="h-5 w-5" />
            </button>
        </div>
    );
}

export default ZoomControls;
