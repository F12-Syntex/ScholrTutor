import { UserCircle } from "@phosphor-icons/react/dist/ssr/UserCircle";

export function StudentAvatar({
  icon,
  size = 28,
}: {
  icon: string;
  size?: number;
}) {
  const trimmed = icon.trim();
  return (
    <div
      className="flex items-center justify-center rounded-full bg-muted text-foreground"
      style={{ width: size, height: size }}
    >
      {trimmed ? (
        <span style={{ fontSize: size * 0.5 }} className="leading-none">
          {trimmed}
        </span>
      ) : (
        <UserCircle
          size={Math.round(size * 0.85)}
          className="text-muted-foreground/40"
          weight="thin"
        />
      )}
    </div>
  );
}
