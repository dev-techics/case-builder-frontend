import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function EditorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <aside className="w-64 p-4">
                <SidebarProvider>
                    <AppSidebar />
                    <main>
                        <SidebarTrigger />
                        {children}
                    </main>
                </SidebarProvider>
            </aside>

            {/* Main Area */}
            <div className="flex flex-1 flex-col">
                {/* Topbar */}
                <header className="flex h-14 items-center justify-between border-b bg-white px-4">
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
                <main className="flex-1 overflow-auto bg-gray-50 p-4">
                    {/* Outlet is where your page content goes */}
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
