"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { User } from "@phosphor-icons/react/dist/ssr/User";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/students": "Students",
  "/session": "Session Log",
  "/files": "Files",
  "/summary": "Summary",
  "/subjects": "Subjects",
};

export function ContentHeader() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "";

  return (
    <header className="flex items-center justify-between h-12 px-3 shrink-0 border-b border-border/40">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
      </div>
      <button className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
        <User size={16} weight="bold" />
      </button>
    </header>
  );
}
