import { CircleNotch } from "@phosphor-icons/react/dist/ssr/CircleNotch";

export default function Loading() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <CircleNotch
        size={20}
        weight="regular"
        className="animate-spin text-muted-foreground/60"
      />
    </div>
  );
}
