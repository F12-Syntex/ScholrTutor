"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning";
import { ArrowClockwise } from "@phosphor-icons/react/dist/ssr/ArrowClockwise";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <Warning size={24} weight="regular" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-medium">Something went wrong</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred."}
        </p>
      </div>
      <Button size="sm" onClick={reset}>
        <ArrowClockwise size={14} className="mr-1.5" /> Try again
      </Button>
    </div>
  );
}
