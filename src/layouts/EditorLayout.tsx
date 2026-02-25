import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import PropertiesSidebar from '@/features/properties-panel';
import EditorSidebar from '@/features/sidebar';
import { SidebarStateProvider } from '@/context/SidebarContext';
import Header from '@/features/editor/components/Header';

const LEFT_SIDEBAR_DEFAULT_WIDTH = 280;
const LEFT_SIDEBAR_MIN_WIDTH = 220;
const LEFT_SIDEBAR_MAX_WIDTH = 520;

const clampSidebarWidth = (width: number) =>
  Math.min(Math.max(width, LEFT_SIDEBAR_MIN_WIDTH), LEFT_SIDEBAR_MAX_WIDTH);

export default function EditorLayout() {
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(
    LEFT_SIDEBAR_DEFAULT_WIDTH
  );
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(LEFT_SIDEBAR_DEFAULT_WIDTH);

  const handleLeftSidebarResize = useCallback((width: number) => {
    setLeftSidebarWidth(clampSidebarWidth(width));
  }, []);

  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    isDraggingRef.current = true;
    dragStartXRef.current = event.clientX;
    dragStartWidthRef.current = leftSidebarWidth;
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current) {
        return;
      }

      const deltaX = event.clientX - dragStartXRef.current;
      handleLeftSidebarResize(dragStartWidthRef.current + deltaX);
    };

    const handlePointerUp = () => {
      if (!isDraggingRef.current) {
        return;
      }

      isDraggingRef.current = false;
      document.body.style.userSelect = '';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handleLeftSidebarResize]);

  const sidebarStyle = {
    '--sidebar-width': `${leftSidebarWidth}px`,
  } as React.CSSProperties;

  return (
    <div className="flex h-screen">
      <SidebarStateProvider>
        {/* Left Sidebar with its own provider */}
        <SidebarProvider className="relative" style={sidebarStyle}>
          <EditorSidebar />
          <SidebarTrigger className="absolute top-3 right-2 z-[99] hidden md:inline-flex" />
          <div
            aria-label="Resize left sidebar"
            className="absolute top-0 right-0 z-[100] hidden h-full w-1.5 cursor-col-resize bg-transparent hover:bg-border md:block"
            onPointerDown={handleDragStart}
            role="separator"
          />
        </SidebarProvider>

        {/* Main Area */}
        <div className="mr-12 flex flex-1 flex-col">
          {/* Topbar */}
          <Header />
          {/* Canvas / Workspace */}
          <main className="relative flex-1 min-h-0 overflow-hidden bg-gray-50 p-4">
            <Outlet />
          </main>
        </div>

        {/* Right Sidebar with its own provider */}
        <PropertiesSidebar />
      </SidebarStateProvider>
    </div>
  );
}
