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
import { SidebarSimple } from "@phosphor-icons/react/dist/ssr/SidebarSimple";
import type { Icon } from "@phosphor-icons/react/dist/lib/types";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
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

function SidebarToggle() {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
    >
      <SidebarSimple size={18} />
    </button>
  );
}

function SearchButton() {
  return (
    <button className="flex items-center gap-2.5 w-full rounded-lg border border-sidebar-border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent">
      <MagnifyingGlass size={16} className="shrink-0" />
      <span className="flex-1 text-left group-data-[collapsible=icon]:hidden">
        Search
      </span>
      <kbd className="pointer-events-none h-5 rounded border border-sidebar-border bg-sidebar px-1.5 font-mono text-[10px] font-medium text-muted-foreground group-data-[collapsible=icon]:hidden">
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
              tooltip={item.label}
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

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3 gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shrink-0">
              <GraduationCap
                className="text-primary-foreground"
                size={18}
                weight="duotone"
              />
            </div>
            <span className="text-[15px] font-semibold tracking-tight truncate group-data-[collapsible=icon]:hidden">
              ScholrTutor
            </span>
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <SidebarToggle />
          </div>
        </div>
        <SearchButton />
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItems />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
