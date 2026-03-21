import { cn } from "@/lib/utils";

export function AppLogo({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 680 680"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 rounded-md", className)}
    >
      <rect width="680" height="680" rx="120" className="fill-primary" />
      <g transform="translate(340, 340)">
        <path
          d="M -80 -130 C -80 -130, 80 -130, 100 -90 C 120 -50, 60 -20, 0 0 C -60 20, -120 50, -100 90 C -80 130, 80 130, 80 130"
          fill="none"
          className="stroke-primary-foreground"
          strokeWidth="52"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="80" cy="-130" r="30" className="fill-primary-foreground" />
        <circle cx="-80" cy="130" r="30" className="fill-primary-foreground" />
      </g>
    </svg>
  );
}
