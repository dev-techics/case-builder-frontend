import { AppSidebar } from "@/features/sidebar/components/AppSidebar";
import {
    SidebarTrigger,
} from "@/features/sidebar/components/ui/sidebar";
import FileTree from "../file-explorer/file-explorer";


export default function Layout() {
    return (
        <AppSidebar>
            <SidebarTrigger />
            <FileTree />
        </AppSidebar>
    );
}
