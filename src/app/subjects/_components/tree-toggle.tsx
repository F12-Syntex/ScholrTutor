import { Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import { Minus } from "@phosphor-icons/react/dist/ssr/Minus";

export function TreeToggle({
  expanded,
  size = 16,
}: {
  expanded: boolean;
  size?: number;
}) {
  const iconSize = Math.round(size * 0.55);
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
      style={{ width: size, height: size }}
    >
      {expanded ? (
        <Minus size={iconSize} weight="bold" />
      ) : (
        <Plus size={iconSize} weight="bold" />
      )}
    </span>
  );
}
