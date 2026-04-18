"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { SettingsProvider } from "@/lib/settings";
import { SubjectsProvider } from "@/lib/subjects";
import { StudentsProvider } from "@/lib/students";
import { BreadcrumbProvider } from "@/lib/breadcrumb";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <SubjectsProvider>
          <StudentsProvider>
            <BreadcrumbProvider>
              <TooltipProvider>
                <SidebarProvider className="flex-col">{children}</SidebarProvider>
              </TooltipProvider>
            </BreadcrumbProvider>
          </StudentsProvider>
        </SubjectsProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
