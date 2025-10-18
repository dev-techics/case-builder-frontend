import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
} from "@/components/ui/sidebar";

export function AppSidebar({
    children,
    side,
}: {
    children: React.ReactNode;
    side: "left" | "right";
}) {
    const sidebarClass =
        side === "left" ? "[--sidebar-width:256px]" : "[--sidebar-width:300px]";

    return (
        <Sidebar
            className={`${sidebarClass} transition-all duration-300 ease-in-out`}
            side={side}
        >
            <SidebarContent>{children}</SidebarContent>
            <SidebarFooter />
        </Sidebar>
    );
}
