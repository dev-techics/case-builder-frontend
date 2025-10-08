import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { changeFooter, changeHeaderLeft, changeHeaderRight } from "../propertiesPanelSlice";

function Annotations() {
    const disPatch = useAppDispatch();
    const { headerLeft, headerRight, footer } = useAppSelector(
        (states) => states.propertiesPanel
    );
    return (
        <div className="space-y-1 p-1">
            <div>Annotations</div>
            {/* Header */}
            <div>
                <div className="ml-2 text-gray-600">Header</div>
                <div className="flex flex-col">
                    <div className="flex flex-col gap-2 p-2">
                        <div>
                            <span className="text-gray-600 text-sm">Left</span>
                        </div>
                        <input
                            className="rounded-md border p-2 text-sm"
                            onBlur={(e) => disPatch(changeHeaderLeft(e.target.value))}
                            type="text"
                            value={headerLeft}

                        />
                    </div>
                    <div className="flex flex-col gap-2 p-2">
                        <div>
                            <span className="text-gray-600 text-sm">Right</span>
                        </div>
                        <input
                            className="rounded-md border p-2 text-sm"
                            onBlur={(e) => disPatch(changeHeaderRight(e.target.value))}
                            type="text"
                            value={headerRight}
                        />
                    </div>
                </div>
            </div>
            {/* Footer */}
            <div className="flex flex-col gap-2 p-2">
                <div>
                    <span className="text-gray-600 text-sm">Footer</span>
                </div>
                <input
                    className="rounded-md border p-2 text-sm"
                    onChange={(e) => disPatch(changeFooter(e.target.value))}
                    type="text"
                    value={footer}
                />
            </div>
        </div>
    );
}

export default Annotations;
