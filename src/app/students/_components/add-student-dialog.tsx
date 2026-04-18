"use client";

import { useState } from "react";
import { useSubjects } from "@/lib/subjects";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AddStudentInput = {
  name: string;
  email: string;
  icon: string;
  subjectId: string;
  targetGrade: string;
  isRegular: boolean;
};

const EMPTY: AddStudentInput = {
  name: "",
  email: "",
  icon: "",
  subjectId: "",
  targetGrade: "",
  isRegular: false,
};

export function AddStudentDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: AddStudentInput) => void;
}) {
  const { subjects } = useSubjects();
  const [data, setData] = useState<AddStudentInput>(EMPTY);

  const reset = () => setData(EMPTY);
  const handleSave = () => {
    if (!data.name.trim()) return;
    onSave({
      ...data,
      name: data.name.trim(),
      email: data.email.trim(),
      icon: data.icon.trim(),
      targetGrade: data.targetGrade.trim(),
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add student</DialogTitle>
          <DialogDescription>Add a new student to your roster.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Field label="Name" required>
            <Input
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="Full name"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              autoFocus
              aria-label="Student name"
            />
          </Field>

          <div className="grid grid-cols-[auto_1fr] gap-3">
            <Field label="Icon">
              <Input
                value={data.icon}
                onChange={(e) => setData({ ...data, icon: e.target.value })}
                placeholder="🎓"
                maxLength={2}
                className="w-16 text-center"
                aria-label="Emoji icon"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                placeholder="student@example.com"
                aria-label="Email"
              />
            </Field>
          </div>

          <Field label="Subject">
            <Select
              value={data.subjectId}
              onValueChange={(v) => setData({ ...data, subjectId: v ?? "" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="No subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Target grade">
            <Input
              value={data.targetGrade}
              onChange={(e) => setData({ ...data, targetGrade: e.target.value })}
              placeholder="e.g. A*"
              aria-label="Target grade"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!data.name.trim()}>
            Add student
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      {children}
    </label>
  );
}
