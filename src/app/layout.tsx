import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import { Titlebar } from "@/components/titlebar";
import { ThemeProvider } from "@/components/theme-provider";
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
          <TooltipProvider>
            <SidebarProvider className="flex-col">
              <Titlebar />
              <div className="flex-1 overflow-hidden flex bg-sidebar">
                <AppSidebar />
                <SidebarInset className="my-2 mr-2 rounded-xl shadow-md overflow-hidden">
                  <div className="flex-1 overflow-auto">
                    {children}
                  </div>
                </SidebarInset>
              </div>
            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
