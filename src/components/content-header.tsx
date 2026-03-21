"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

export function ContentHeader() {
  const { state } = useSidebar();

  return (
    <header className="flex items-center h-12 px-4 shrink-0 border-b border-border/40">
      {state === "collapsed" && <SidebarTrigger />}
    </header>
  );
}
