import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import { Titlebar } from "@/components/titlebar";
import { ThemeProvider } from "@/components/theme-provider";
import { SettingsProvider } from "@/lib/settings";
import { SubjectsProvider } from "@/lib/subjects";
import { BreadcrumbProvider } from "@/lib/breadcrumb";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";


export const metadata: Metadata = {
  title: "ScholrTutor",
  description: "Tutor management desktop app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="h-full flex flex-col overflow-hidden antialiased">
        <ThemeProvider>
          <SettingsProvider>
          <SubjectsProvider>
          <BreadcrumbProvider>
          <TooltipProvider>
            <SidebarProvider className="flex-col">
              <Titlebar />
              <div className="flex-1 overflow-hidden flex bg-sidebar">
                <AppSidebar />
                <SidebarInset className="shadow-md overflow-hidden" style={{ margin: 'var(--panel-gap, 8px)', borderRadius: 'var(--panel-radius, 12px)' }}>
                  <div className="flex-1 overflow-auto">
                    {children}
                  </div>
                </SidebarInset>
              </div>
            </SidebarProvider>
          </TooltipProvider>
          </BreadcrumbProvider>
          </SubjectsProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
