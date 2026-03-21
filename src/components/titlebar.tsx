"use client";

import { Minus, Square, X } from "@phosphor-icons/react";

export function Titlebar() {
  const handleMinimize = () => window.electron?.window.minimize();
  const handleMaximize = () => window.electron?.window.maximize();
  const handleClose = () => window.electron?.window.close();

  return (
    <header
      className="flex items-center justify-between h-9 bg-sidebar border-b border-border select-none shrink-0"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div className="flex-1" />
      <div
        className="flex items-center h-full"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="inline-flex items-center justify-center w-11 h-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={handleMaximize}
          className="inline-flex items-center justify-center w-11 h-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Square size={12} />
        </button>
        <button
          onClick={handleClose}
          className="inline-flex items-center justify-center w-11 h-full text-muted-foreground hover:bg-destructive hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </header>
  );
}
