import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import PropertiesSidebar from "@/features/properties-panel/sidebar";
import EditorSidebar from "../features/sidebar/EditorSidebar";

export default function EditorLayout() {
    return (
        <SidebarProvider>
            {/* Sidebar */}

            <EditorSidebar />
            <SidebarTrigger className="text-xl" />

            {/* Main Area */}
            <div className="flex flex-1 flex-col">
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
                    {/* Outlet is where your page content goes */}
                    <Outlet />
                </main>
            </div>

            <PropertiesSidebar />
        </SidebarProvider>
    );
}
