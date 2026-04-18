"use client";

import { useRef, useState } from "react";
import { UploadSimple } from "@phosphor-icons/react/dist/ssr/UploadSimple";

const ACCEPTED = ".pdf,.json,.md,.txt";

export function DropRow({ onFile }: { onFile: (file: File) => void }) {
  const [hover, setHover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <button
      type="button"
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
      onClick={() => inputRef.current?.click()}
      className={`flex w-full items-center gap-3 rounded-lg border-2 border-dashed px-4 py-4 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
        hover
          ? "border-primary bg-primary/5"
          : "border-border hover:border-foreground/40"
      }`}
    >
      <UploadSimple size={18} className="shrink-0 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">
        Drop a spec file to add a subject
      </span>
      <span className="ml-auto text-xs text-muted-foreground">
        PDF · JSON · MD · TXT
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </button>
  );
}
