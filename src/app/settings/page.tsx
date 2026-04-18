"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralTab } from "./_components/general-tab";
import { AppearanceTab } from "./_components/appearance-tab";
import { DataTab } from "./_components/data-tab";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <header className="shrink-0">
        <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your ScholrTutor experience.
        </p>
      </header>

      <Tabs defaultValue="general" className="flex-1 min-h-0 flex flex-col">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="data">Data &amp; About</TabsTrigger>
        </TabsList>

        <div className="scroll-panel flex-1 min-h-0 overflow-auto pt-2">
          <TabsContent value="general">
            <GeneralTab />
          </TabsContent>
          <TabsContent value="appearance">
            <AppearanceTab />
          </TabsContent>
          <TabsContent value="data">
            <DataTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
