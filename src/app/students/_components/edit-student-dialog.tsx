"use client";

import { useEffect, useState } from "react";
import type { Student } from "@/lib/students";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function EditStudentDialog({
  student,
  open,
  onOpenChange,
  onSave,
}: {
  student: Student;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    name: string;
    email: string;
    referenceNumber: string;
    icon: string;
  }) => void;
}) {
  const [name, setName] = useState(student.name);
  const [email, setEmail] = useState(student.email);
  const [ref, setRef] = useState(student.referenceNumber);
  const [icon, setIcon] = useState(student.icon);

  useEffect(() => {
    if (open) {
      setName(student.name);
      setEmail(student.email);
      setRef(student.referenceNumber);
      setIcon(student.icon);
    }
  }, [open, student]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({
      name: trimmed,
      email: email.trim(),
      referenceNumber: ref.trim() || student.referenceNumber,
      icon: icon.trim(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit student</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                Icon
              </span>
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🎓"
                maxLength={2}
                className="w-16 text-center"
                aria-label="Icon emoji"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                Name
              </span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
                aria-label="Name"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Reference
            </span>
            <Input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              className="font-mono"
              placeholder="ST-001"
              aria-label="Reference number"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Email
            </span>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email"
            />
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
