"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SquaresFour } from "@phosphor-icons/react/dist/ssr/SquaresFour";
import { Users } from "@phosphor-icons/react/dist/ssr/Users";
import { ChatText } from "@phosphor-icons/react/dist/ssr/ChatText";
import { FolderOpen } from "@phosphor-icons/react/dist/ssr/FolderOpen";
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText";
import { Books } from "@phosphor-icons/react/dist/ssr/Books";
import { GearSix } from "@phosphor-icons/react/dist/ssr/GearSix";
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { Star } from "@phosphor-icons/react/dist/ssr/Star";
import { AppLogo } from "@/components/app-logo";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { useSubjects } from "@/lib/subjects";
import { useStudents } from "@/lib/students";
import type { Icon } from "@phosphor-icons/react/dist/lib/types";
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";

const navItems: { href: string; label: string; icon: Icon }[] = [
  { href: "/", label: "Dashboard", icon: SquaresFour },
  { href: "/students", label: "Students", icon: Users },
  { href: "/session", label: "Session Times", icon: ChatText },
  { href: "/files", label: "Files", icon: FolderOpen },
  { href: "/summary", label: "Student Summary", icon: FileText },
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
  const { subjects } = useSubjects();
  const { students } = useStudents();
  const [manualOpen, setManualOpen] = useState<Record<string, boolean>>({});

  const toggle = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setManualOpen(prev => ({ ...prev, [href]: !prev[href] }));
  };

  // Sort students: starred first, then alphabetical
  const sortedStudents = [...students].sort((a, b) => {
    if (a.isStarred && !b.isStarred) return -1;
    if (!a.isStarred && b.isStarred) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        // Determine sub-items
        const hasSubjects = item.href === "/subjects" && subjects.length > 0;
        const starredStudents = sortedStudents.filter(s => s.isStarred);
        const hasStudents = item.href === "/students" && starredStudents.length > 0;
        const hasChildren = hasSubjects || hasStudents;
        const isOpen = hasChildren && (isActive || manualOpen[item.href]);

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
              <span className="flex-1">{item.label}</span>
              {hasChildren && (
                <span
                  role="button"
                  onClick={(e) => toggle(item.href, e)}
                  className="flex items-center justify-center size-5 rounded-sm text-muted-foreground/40 hover:text-muted-foreground hover:bg-sidebar-accent transition-all"
                >
                  <CaretRight
                    size={12}
                    className={`transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
                  />
                </span>
              )}
            </SidebarMenuButton>

            {/* Subject sub-items */}
            {hasSubjects && isOpen && (
              <SidebarMenuSub>
                {subjects.map((s) => (
                  <SidebarMenuSubItem key={s.id}>
                    <SidebarMenuSubButton size="sm" render={<Link href="/subjects" />}>
                      <span className="truncate">{s.name}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            )}

            {/* Starred student sub-items */}
            {hasStudents && isOpen && (
              <SidebarMenuSub>
                {starredStudents.map((s) => (
                  <SidebarMenuSubItem key={s.id}>
                    <SidebarMenuSubButton size="sm" render={<Link href={`/students?id=${s.id}`} />}>
                      <Star size={10} weight="fill" className="text-warning shrink-0" />
                      <span className="truncate">{s.name}</span>
                      <span className="text-[9px] font-mono text-muted-foreground/30 ml-auto shrink-0">{s.referenceNumber}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            )}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function SettingsButton() {
  const pathname = usePathname();
  const isActive = pathname === "/settings";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isActive}
          render={<Link href="/settings" />}
        >
          <GearSix
            size={18}
            weight={isActive ? "fill" : "regular"}
            className="shrink-0"
          />
          <span>Settings</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="px-3.5 pt-3 pb-1 gap-3.5">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <AppLogo size={28} />
          <span className="text-[14px] font-semibold tracking-tight truncate text-sidebar-foreground">
            ScholrTutor
          </span>
        </div>
        <SearchButton />
      </SidebarHeader>

      <SidebarContent className="px-4 pt-2">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-2 mb-0.5">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItems />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 pb-3 pt-0">
        <SettingsButton />
      </SidebarFooter>
    </Sidebar>
  );
}
