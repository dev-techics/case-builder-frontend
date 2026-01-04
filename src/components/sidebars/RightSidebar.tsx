import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useSidebarState } from '@/context/SidebarContext';

function RightSidebar({ children }: { children: React.ReactNode }) {
  const { isOpen, setIsOpen } = useSidebarState();
  return (
    <SidebarProvider className="relative" open={isOpen}>
      <SidebarTrigger
        className="absolute right-4 z-50 mt-1 text-2xl"
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
      />
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
}

export default RightSidebar;
