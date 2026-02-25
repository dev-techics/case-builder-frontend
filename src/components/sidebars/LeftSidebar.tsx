import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';

type LeftSidebarProps = {
  children: React.ReactNode;
};

const LeftSidebar = ({ children }: LeftSidebarProps) => {
  return (
    <Sidebar
      className="transition-all duration-300 ease-in-out"
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
