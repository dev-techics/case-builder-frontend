import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';

function LeftSidebar({
  children,
  side,
}: {
  children: React.ReactNode;
  side: 'left' | 'right';
}) {
  const sidebarClass =
    side === 'left' ? '[--sidebar-width:256px]' : '[--sidebar-width:300px]';

  // Add collapsible="none" for right sidebar to prevent width issues
  const collapsible = side === 'right' ? 'offcanvas' : 'offcanvas';

  return (
    <Sidebar
      className={`${sidebarClass} transition-all duration-300 ease-in-out`}
      collapsible={collapsible}
      side={side}
      variant="sidebar"
    >
      <SidebarContent>{children}</SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}

export default LeftSidebar;
