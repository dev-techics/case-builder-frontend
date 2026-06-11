import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useSidebarState } from '@/context/SidebarContext';

const RIGHT_SIDEBAR_WIDTH = '300px';

const RightSidebarToggle = ({ onToggle }: { onToggle: () => void }) => {
  const { state } = useSidebar();

  return (
    <SidebarTrigger
      className="fixed top-20 z-50 text-2xl transition-[right] duration-200 ease-linear"
      onClick={onToggle}
      size="lg"
      style={{
        right: state === 'collapsed' ? '0.75rem' : 'calc(var(--sidebar-width))',
      }}
    />
  );
};

const RightSidebar = ({ children }: { children: React.ReactNode }) => {
  const { isOpen, setIsOpen } = useSidebarState();
  const sidebarStyle = {
    '--sidebar-width': RIGHT_SIDEBAR_WIDTH,
  } as React.CSSProperties;

  return (
    <SidebarProvider className="relative" open={isOpen} style={sidebarStyle}>
      <RightSidebarToggle onToggle={() => setIsOpen(!isOpen)} />
      <Sidebar
        className="top-[72px] h-[calc(100vh-72px)] transition-all z-0 duration-300 ease-in-out"
        collapsible="offcanvas"
        side="right"
        variant="sidebar"
      >
        <SidebarContent>{children}</SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
};

export default RightSidebar;
