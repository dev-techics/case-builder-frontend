import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
} from '@/components/ui/sidebar';
import SidebarFooterMenu from './SidebarFooterMenu';
import DashboardSidebarMenu from './SidebarMenu';

const DashboardSidebar = () => {
  return (
    <Sidebar collapsible="icon" className="top-16 h-[calc(100vh-4rem)]">
      <SidebarContent>
        <SidebarGroup>
          <DashboardSidebarMenu />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarFooterMenu />
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
