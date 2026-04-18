"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SquaresFour } from "@phosphor-icons/react/dist/ssr/SquaresFour";
import { Users } from "@phosphor-icons/react/dist/ssr/Users";
import { ChatText } from "@phosphor-icons/react/dist/ssr/ChatText";
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText";
import { Books } from "@phosphor-icons/react/dist/ssr/Books";
import { GearSix } from "@phosphor-icons/react/dist/ssr/GearSix";
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { Star } from "@phosphor-icons/react/dist/ssr/Star";
import type { Icon } from "@phosphor-icons/react/dist/lib/types";
import { AppLogo } from "@/components/app-logo";
import { useSubjects } from "@/lib/subjects";
import { useStudents } from "@/lib/students";
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
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

const navItems: { href: string; label: string; icon: Icon }[] = [
  { href: "/", label: "Dashboard", icon: SquaresFour },
  { href: "/students", label: "Students", icon: Users },
  { href: "/session", label: "Session Times", icon: ChatText },
  { href: "/summary", label: "Student Summary", icon: FileText },
  { href: "/subjects", label: "Subjects", icon: Books },
];

function NavItems() {
  const pathname = usePathname();
  const { subjects } = useSubjects();
  const { students } = useStudents();
  const [manualOpen, setManualOpen] = useState<Record<string, boolean>>({});

  const toggle = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setManualOpen((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  const starredStudents = useMemo(
    () =>
      students
        .filter((s) => s.isStarred)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [students],
  );

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        const hasSubjects = item.href === "/subjects" && subjects.length > 0;
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
                  tabIndex={0}
                  aria-label={isOpen ? "Collapse" : "Expand"}
                  onClick={(e) => toggle(item.href, e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(item.href, e as unknown as React.MouseEvent);
                    }
                  }}
                  className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <CaretRight
                    size={12}
                    className={`transition-transform duration-150 ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                </span>
              )}
            </SidebarMenuButton>

            {hasSubjects && isOpen && (
              <SidebarMenuSub>
                {subjects.map((s) => (
                  <SidebarMenuSubItem key={s.id}>
                    <SidebarMenuSubButton
                      size="sm"
                      render={<Link href={`/subjects?id=${s.id}`} />}
                    >
                      <span className="truncate">{s.name}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            )}

            {hasStudents && isOpen && (
              <SidebarMenuSub>
                {starredStudents.map((s) => (
                  <SidebarMenuSubItem key={s.id}>
                    <SidebarMenuSubButton
                      size="sm"
                      render={<Link href={`/students?id=${s.id}`} />}
                    >
                      <Star
                        size={10}
                        weight="fill"
                        className="shrink-0 text-warning"
                      />
                      <span className="truncate">{s.name}</span>
                      <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
                        {s.referenceNumber}
                      </span>
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
      <SidebarHeader className="gap-3.5 px-3.5 pb-1 pt-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <AppLogo size={28} />
          <span className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
            ScholrTutor
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 pt-2">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="mb-0.5 px-2">
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
