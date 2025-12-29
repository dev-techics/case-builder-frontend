import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import IndexInitializer from '@/features/auto-index/components/IndexInitializer';
import PropertiesSidebar from '@/features/properties-panel/sidebar';
import EditorSidebar from '../features/sidebar/EditorSidebar';
import { SidebarStateProvider } from '@/context/SidebarContext';
import Header from '@/features/editor/components/Header';

export default function EditorLayout() {
  return (
    <div className="flex h-screen">
      <SidebarStateProvider>
        <IndexInitializer />
        {/* Left Sidebar with its own provider */}
        <SidebarProvider>
          <EditorSidebar />
          <SidebarTrigger className="text-xl" />
        </SidebarProvider>

        {/* Main Area */}
        <div className="mr-12 flex flex-1 flex-col">
          {/* Topbar */}
          <Header />
          {/* Canvas / Workspace */}
          <main className="relative flex-1 overflow-auto bg-gray-50 p-4">
            <Outlet />
          </main>
        </div>

        {/* Right Sidebar with its own provider */}
        <PropertiesSidebar />
      </SidebarStateProvider>
    </div>
  );
}
