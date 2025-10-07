import { AppSidebar } from "@/components/AppSidebar";

import Annotations from "./components/Annotations";
import DocumentSettings from "./components/DocumentSettings";
import Exports from "./components/Exports";

function PropertiesSidebar() {
    return (
        <AppSidebar side="right">
            <div className="mb-2 border-b-1 p-2">Document Properties</div>

            <DocumentSettings />

            <hr />
            <Annotations />

            <hr />
            <Exports />
        </AppSidebar>
    );
}

export default PropertiesSidebar;
