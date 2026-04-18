"use client";

import { CaretLeft } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { Button } from "@/components/ui/button";
import { toDateKey } from "@/lib/session-log";

function formatDateHeading(date: Date): string {
  const today = new Date();
  const todayKey = toDateKey(today);
  const dateKey = toDateKey(date);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === todayKey) return "Today";
  if (dateKey === toDateKey(yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DateNav({
  date,
  onChange,
  trailing,
}: {
  date: Date;
  onChange: (d: Date) => void;
  trailing?: React.ReactNode;
}) {
  const prev = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    onChange(d);
  };
  const next = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    onChange(d);
  };
  const isToday = toDateKey(date) === toDateKey(new Date());

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Previous day"
        onClick={prev}
      >
        <CaretLeft size={14} />
      </Button>
      <span className="min-w-40 text-center text-sm font-medium">
        {formatDateHeading(date)}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Next day"
        onClick={next}
      >
        <CaretRight size={14} />
      </Button>
      {!isToday && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(new Date())}
        >
          Today
        </Button>
      )}
      {trailing && <div className="ml-auto">{trailing}</div>}
    </div>
  );
}
