import { AppSidebar } from "@/components/AppSidebar";
import { ExportPdfButtonWithToggle } from "../../components/ExportButton";
import Annotations from "./components/Annotations";
import DocumentSettings from "./components/DocumentSettings";

function PropertiesSidebar() {
    return (
        <AppSidebar side="right">
            <div className="mb-2 border-b-1 p-2">Document Properties</div>

            <DocumentSettings />

            <hr />
            <Annotations />
            <hr />

            <hr />
            <ExportPdfButtonWithToggle />
            {/* <Exports /> */}
        </AppSidebar>
    );
}

export default PropertiesSidebar;
