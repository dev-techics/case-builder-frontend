import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import IndexInitializer from '@/features/auto-index/components/IndexInitializer';
import PropertiesSidebar from '@/features/properties-panel/sidebar';
import EditorSidebar from '../features/sidebar/EditorSidebar';
import { SidebarStateProvider } from '@/context/SidebarContext';

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
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-white px-4">
            <h1 className="font-semibold">Editor</h1>
            <div className="flex items-center gap-4">
              <button
                className="rounded bg-blue-600 px-3 py-1 text-white"
                type="button"
              >
                Save
              </button>
              <div className="h-8 w-8 rounded-full bg-gray-300" />
            </div>
          </header>

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
