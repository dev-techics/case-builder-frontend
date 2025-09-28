import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";
import { AppSidebar } from "@/features/sidebar/components/AppSidebar";
import {
    SidebarTrigger,
} from "@/features/sidebar/components/ui/sidebar";
import FileTree from "../file-explorer/file-explorer";

// Menu items.
const items = [
    {
        title: "Home",
        url: "#",
        icon: Home,
    },
    {
        title: "Inbox",
        url: "#",
        icon: Inbox,
    },
    {
        title: "Calendar",
        url: "#",
        icon: Calendar,
    },
    {
        title: "Search",
        url: "#",
        icon: Search,
    },
    {
        title: "Settings",
        url: "#",
        icon: Settings,
    },
];

export default function Layout() {
    return (
        <AppSidebar>
            <SidebarTrigger />
            <FileTree />
        </AppSidebar>
    );
}
