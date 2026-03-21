"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  Users,
  ChatText,
  FolderOpen,
  FileText,
  Books,
  CaretLineLeft,
  CaretLineRight,
  GraduationCap,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

const navItems: { href: string; label: string; icon: Icon }[] = [
  { href: "/", label: "Dashboard", icon: SquaresFour },
  { href: "/students", label: "Students", icon: Users },
  { href: "/session", label: "Session Log", icon: ChatText },
  { href: "/files", label: "Files", icon: FolderOpen },
  { href: "/summary", label: "Summary", icon: FileText },
  { href: "/subjects", label: "Subjects", icon: Books },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col h-full border-r border-border bg-sidebar transition-all duration-200 ease-in-out",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 h-14 shrink-0",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
          <GraduationCap
            className="text-primary-foreground"
            size={20}
            weight="duotone"
          />
        </div>
        {!collapsed && (
          <span className="text-base font-semibold tracking-tight">
            ScholrTutor
          </span>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          const iconWeight = isActive ? "fill" : "regular";

          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed && "justify-center px-0 w-10 h-10 mx-auto"
              )}
            >
              <item.icon size={20} weight={iconWeight} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        "justify-center px-0 w-10 h-10 mx-auto"
                      )}
                    />
                  }
                >
                  <item.icon
                    size={20}
                    weight={iconWeight}
                    className="shrink-0"
                  />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>

      <Separator />

      {/* Footer: collapse toggle */}
      <div
        className={cn(
          "flex items-center px-3 py-3 shrink-0",
          collapsed ? "justify-center" : "justify-end"
        )}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {collapsed ? (
            <CaretLineRight size={16} />
          ) : (
            <CaretLineLeft size={16} />
          )}
        </button>
      </div>
    </aside>
  );
}
