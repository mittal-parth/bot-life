import { DrawablyCard } from "drawably/react";
import type { ReactNode } from "react";

export function PanelPaper({ children }: { children: ReactNode }) {
  return (
    <DrawablyCard
      className="panel-paper"
      seed={63}
      boil={0}
      roughness={1.15}
      width={1.6}
      stroke="#6b6551"
    >
      <div className="panel-pages">{children}</div>
    </DrawablyCard>
  );
}
