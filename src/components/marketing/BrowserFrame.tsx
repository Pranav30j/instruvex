import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BrowserFrameProps {
  url?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** macOS-style app window used to present realistic product previews. */
export default function BrowserFrame({
  url = "instruvex.in/dashboard",
  children,
  className,
  bodyClassName,
}: BrowserFrameProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-navy-surface shadow-[var(--shadow-elevated)]",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-border bg-navy-elevated/60 px-3 py-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[hsl(0_60%_45%)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[hsl(40_60%_45%)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[hsl(140_40%_38%)]" />
        </div>
        <div className="flex-1 truncate rounded border border-border/70 bg-background/60 px-2 py-0.5 text-center text-[10px] text-muted-foreground">
          {url}
        </div>
      </div>
      <div className={cn("bg-background/40", bodyClassName)}>{children}</div>
    </div>
  );
}