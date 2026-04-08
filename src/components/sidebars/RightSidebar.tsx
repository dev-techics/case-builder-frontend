import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useSidebarState } from '@/context/SidebarContext';

const RightSidebarToggle = ({ onToggle }: { onToggle: () => void }) => {
  const { state } = useSidebar();

  return (
    <SidebarTrigger
      className="fixed top-3 z-50 text-2xl transition-[right] duration-200 ease-linear"
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
  return (
    <SidebarProvider className="relative" open={isOpen}>
      <RightSidebarToggle onToggle={() => setIsOpen(!isOpen)} />
      <Sidebar
        className="transition-all z-0 duration-300 ease-in-out [--sidebar-width:300px]"
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
