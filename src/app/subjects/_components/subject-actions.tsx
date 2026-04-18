"use client";

import { useState } from "react";
import { DotsThreeVertical } from "@phosphor-icons/react/dist/ssr/DotsThreeVertical";
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { DownloadSimple } from "@phosphor-icons/react/dist/ssr/DownloadSimple";
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash";
import type { Subject } from "@/lib/subjects";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/app/students/_components/confirm-dialog";
import { exportSubjectJson } from "./export";

export function SubjectActions({
  subject,
  onDelete,
  onRename,
  side = "bottom",
}: {
  subject: Subject;
  onDelete: () => void;
  onRename?: () => void;
  side?: "top" | "bottom";
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Subject actions"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-accent hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <DotsThreeVertical size={16} weight="bold" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side={side}>
          {onRename && (
            <DropdownMenuItem onClick={onRename}>
              <PencilSimple size={14} /> Rename
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => exportSubjectJson(subject)}>
            <DownloadSimple size={14} /> Export JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setDeleteOpen(true)}
        aria-label="Delete subject"
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash size={14} />
      </Button>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete subject?"
        description={
          <>
            <span className="font-medium text-foreground">{subject.name}</span>{" "}
            and all {subject.topics.length} topics will be permanently deleted.
            This cannot be undone.
          </>
        }
        onConfirm={onDelete}
      />
    </div>
  );
}
