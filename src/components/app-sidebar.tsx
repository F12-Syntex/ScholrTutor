"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  Users,
  ChatText,
  FolderOpen,
  FileText,
  Books,
  GraduationCap,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const navItems: { href: string; label: string; icon: Icon }[] = [
  { href: "/", label: "Dashboard", icon: SquaresFour },
  { href: "/students", label: "Students", icon: Users },
  { href: "/session", label: "Session Log", icon: ChatText },
  { href: "/files", label: "Files", icon: FolderOpen },
  { href: "/summary", label: "Summary", icon: FileText },
  { href: "/subjects", label: "Subjects", icon: Books },
];

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
                size={20}
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
      <SidebarHeader className="px-3 py-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shrink-0">
            <GraduationCap
              className="text-primary-foreground"
              size={18}
              weight="duotone"
            />
          </div>
          <span className="text-base font-semibold tracking-tight truncate group-data-[collapsible=icon]:hidden">
            ScholrTutor
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <NavItems />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
