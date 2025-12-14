import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';

const LeftSidebar = ({ children }: { children: React.ReactNode }) => {
  return (
    <Sidebar
      className="[--sidebar-width:260px] transition-all duration-300 ease-in-out"
      collapsible="offcanvas"
      side="left"
      variant="sidebar"
    >
      <SidebarContent>{children}</SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
};

export default LeftSidebar;
