import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from "@/components/ui/sidebar";

export function AppSidebar({ children, side }: { children: React.ReactNode, side: "left" | "right" }) {
    return (
        <Sidebar side={side}>
            <SidebarHeader />
            <SidebarContent>{children}</SidebarContent>
            <SidebarFooter />
        </Sidebar>
    );
}
