import { Copy, RotateCcw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import {
    changeFooter,
    changeHeaderLeft,
    changeHeaderRight,
} from "../propertiesPanelSlice";

function Annotations() {
    const dispatch = useAppDispatch();
    const { headerLeft, headerRight, footer } = useAppSelector(
        (states) => states.propertiesPanel
    );
    const handleReset = () => {
        dispatch(changeHeaderLeft(""));
        dispatch(changeHeaderRight(""));
        dispatch(changeFooter(""));
    };

    const handleCopyPreview = () => {
        const preview = `Header Left: ${headerLeft}\nHeader Right: ${headerRight}\nFooter: ${footer}`;
        navigator.clipboard.writeText(preview);
    };

    const inputClass =
        "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors";

    const labelClass = "block text-xs font-semibold text-gray-700 mb-1.5";
    const sectionClass =
        "space-y-2 p-3 rounded-lg border border-gray-100 bg-gray-50 hover:border-gray-200 transition-colors";

    return (
        <div className="space-y-4">
            {/* Header Section */}
            <div>
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-sm">Page Headers</h3>
                    <span className="text-gray-400 text-xs">
                        Appears on top of each page
                    </span>
                </div>

                <div className={sectionClass}>
                    <div>
                        <label className={labelClass} htmlFor="header-left">
                            Left
                        </label>
                        <input
                            className={inputClass}
                            id="header-left"
                            onBlur={(e) => dispatch(changeHeaderLeft(e.target.value))}
                            onChange={(e) => e.target.value}
                            placeholder="e.g., Company Name"
                            type="text"
                            value={headerLeft}
                        />
                    </div>
                </div>

                <div className={sectionClass}>
                    <div>
                        <label className={labelClass} htmlFor="header-right">
                            Right
                        </label>
                        <input
                            className={inputClass}
                            id="header-right"
                            onBlur={(e) => dispatch(changeHeaderRight(e.target.value))}
                            onChange={(e) => e.target.value}
                            placeholder="e.g., Document Version"
                            type="text"
                            value={headerRight}
                        />
                    </div>
                </div>
            </div>

            {/* Footer Section */}
            <div>
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-sm">Page Footer</h3>
                    <span className="text-gray-400 text-xs">
                        Appears on bottom of each page
                    </span>
                </div>

                <div className={sectionClass}>
                    <div>
                        <label className={labelClass} htmlFor="footer">
                            Footer Text
                        </label>
                        <input
                            className={inputClass}
                            id="footer"
                            onBlur={(e) => dispatch(changeFooter(e.target.value))}
                            onChange={(e) => e.target.value}
                            placeholder="e.g., Confidential"
                            type="text"
                            value={footer}
                        />
                        <p className="mt-1.5 text-gray-500 text-xs">
                            💡 Tip: Page numbers are automatically added to the right
                        </p>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="mb-2 font-semibold text-blue-900 text-xs">Preview</p>
                <div className="space-y-1 rounded border border-blue-100 bg-white p-2 font-mono text-blue-800 text-xs">
                    {headerLeft && (
                        <div className="flex justify-between">
                            <span className="text-gray-600">← {headerLeft}</span>
                            <span className="text-gray-600">{headerRight} →</span>
                        </div>
                    )}
                    {!(headerLeft || headerRight) && (
                        <div className="text-gray-400 italic">Headers will appear here</div>
                    )}
                    {footer && (
                        <div className="mt-1 flex justify-between border-blue-100 border-t pt-1">
                            <span className="text-gray-600">← {footer}</span>
                            <span className="text-gray-600">Page # →</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                <Button
                    className="flex-1"
                    onClick={handleCopyPreview}
                    size="sm"
                    variant="outline"
                >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy
                </Button>
                <Button
                    className="flex-1"
                    onClick={handleReset}
                    size="sm"
                    variant="outline"
                >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Reset
                </Button>
            </div>
        </div>
    );
}

export default Annotations;
