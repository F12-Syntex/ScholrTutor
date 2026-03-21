"use client";

import { usePathname } from "next/navigation";
import { Minus } from "@phosphor-icons/react/dist/ssr/Minus";
import { Square } from "@phosphor-icons/react/dist/ssr/Square";
import { X } from "@phosphor-icons/react/dist/ssr/X";
import { SidebarSimple } from "@phosphor-icons/react/dist/ssr/SidebarSimple";
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { useSidebar } from "@/components/ui/sidebar";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/students": "Students",
  "/session": "Session Log",
  "/files": "Files",
  "/summary": "Summary",
  "/subjects": "Subjects",
  "/settings": "Settings",
};

export function Titlebar() {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "";
  const handleMinimize = () => window.electron?.window.minimize();
  const handleMaximize = () => window.electron?.window.maximize();
  const handleClose = () => window.electron?.window.close();

  return (
    <header
      className="flex items-center h-9 bg-sidebar select-none shrink-0"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {/* Left: sidebar toggle + breadcrumb */}
      <div
        className="flex items-center h-full px-1.5"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Toggle sidebar (Ctrl+B)"
        >
          <SidebarSimple size={16} />
        </button>
        <CaretRight
          size={12}
          className="mx-1 text-muted-foreground/40 shrink-0"
        />
        <span className="text-xs font-medium text-muted-foreground/80 truncate">
          {title}
        </span>
      </div>

      {/* Center: draggable spacer */}
      <div className="flex-1" />

      {/* Right: window controls */}
      <div
        className="flex items-center h-full"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="inline-flex items-center justify-center w-11 h-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={handleMaximize}
          className="inline-flex items-center justify-center w-11 h-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Square size={12} />
        </button>
        <button
          onClick={handleClose}
          className="inline-flex items-center justify-center w-11 h-full text-muted-foreground hover:bg-destructive hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </header>
  );
}
