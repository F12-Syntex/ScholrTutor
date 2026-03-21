"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SquaresFour } from "@phosphor-icons/react/dist/ssr/SquaresFour";
import { Users } from "@phosphor-icons/react/dist/ssr/Users";
import { ChatText } from "@phosphor-icons/react/dist/ssr/ChatText";
import { FolderOpen } from "@phosphor-icons/react/dist/ssr/FolderOpen";
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText";
import { Books } from "@phosphor-icons/react/dist/ssr/Books";
import { GraduationCap } from "@phosphor-icons/react/dist/ssr/GraduationCap";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { CaretDoubleLeft } from "@phosphor-icons/react/dist/ssr/CaretDoubleLeft";
import type { Icon } from "@phosphor-icons/react/dist/lib/types";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems: { href: string; label: string; icon: Icon }[] = [
  { href: "/", label: "Dashboard", icon: SquaresFour },
  { href: "/students", label: "Students", icon: Users },
  { href: "/session", label: "Session Log", icon: ChatText },
  { href: "/files", label: "Files", icon: FolderOpen },
  { href: "/summary", label: "Summary", icon: FileText },
  { href: "/subjects", label: "Subjects", icon: Books },
];

function SearchButton() {
  return (
    <button className="flex items-center gap-2.5 w-full rounded-lg border border-sidebar-border/50 bg-sidebar px-3 h-9 text-[13px] font-medium text-muted-foreground hover:bg-sidebar-accent transition-colors">
      <MagnifyingGlass size={15} className="shrink-0 opacity-60" />
      <span className="flex-1 text-left">Search</span>
      <kbd className="pointer-events-none h-5 rounded border border-sidebar-border/50 bg-background/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/60">
        /
      </kbd>
    </button>
  );
}

function NavItems() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              isActive={isActive}
              render={<Link href={item.href} />}
            >
              <item.icon
                size={18}
                weight={isActive ? "fill" : "regular"}
                className="shrink-0"
              />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function CollapseButton() {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className="flex items-center justify-center w-8 h-8 rounded-md text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
      title="Collapse sidebar (Ctrl+B)"
    >
      <CaretDoubleLeft size={14} />
    </button>
  );
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="offcanvas">
      {/* Header: logo + brand + collapse */}
      <SidebarHeader className="px-3.5 pt-3 pb-1 gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary shrink-0">
              <GraduationCap
                className="text-primary-foreground"
                size={15}
                weight="duotone"
              />
            </div>
            <span className="text-[14px] font-semibold tracking-tight truncate text-sidebar-foreground">
              ScholrTutor
            </span>
          </div>
          <CollapseButton />
        </div>
        <SearchButton />
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-3 pt-2">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-2 mb-0.5">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItems />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: theme toggle */}
      <SidebarFooter className="px-3.5 py-3 border-t border-sidebar-border/40">
        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
