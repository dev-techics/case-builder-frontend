import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import 'react-toastify/dist/ReactToastify.css';
import { Outlet } from 'react-router';
import { ToastContainer } from 'react-toastify';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';

const DashboardLayout = () => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Fixed Topbar */}
      <div className="h-16 border-b bg-background flex items-center px-4 flex-shrink-0">
        Case Bundler
      </div>

      {/* Content area with sidebar - starts below topbar */}
      <SidebarProvider>
        <div className="flex flex-1 overflow-hidden">
          <DashboardSidebar />

          {/* Main Content Area */}
          <div className="flex flex-col flex-1 w-full overflow-hidden">
            <div className="p-4">
              <SidebarTrigger />
            </div>

            <main className="flex-1 overflow-auto px-6 pb-12">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>

      <ToastContainer
        position="bottom-right"
        hideProgressBar={true}
        className="text-sm"
        draggable
      />
    </div>
  );
};

export default DashboardLayout;
