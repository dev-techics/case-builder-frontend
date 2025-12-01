import AppSidebar from "@/components/AppSidebar";

// import { SidebarTrigger } from "@/components/ui/sidebar";

import FileTree from "../file-explorer/FileExplorer";

export default function Layout() {
    return (
        <AppSidebar side="left">
            <FileTree />
        </AppSidebar>
    );
}
