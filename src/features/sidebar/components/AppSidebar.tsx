import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from "@/features/sidebar/components/ui/sidebar";

export function AppSidebar({ children }: { children: React.ReactNode }) {
    return (
        <Sidebar>
            <SidebarHeader />
            <SidebarContent>{children}</SidebarContent>
            <SidebarFooter />
        </Sidebar>
    );
}
