import type { Item } from "../shared/town.ts";

export const day = 86400000;
export function overdueDays(item: Item, now: number) {
  return item.due_at
    ? Math.max(0, Math.floor((now - Date.parse(item.due_at)) / day))
    : 0;
}
export function decay(item: Item, now: number) {
  if (item.state === "snoozed") return "snoozed";
  if (item.state === "fixed") return "fine";
  const days = overdueDays(item, now);
  if (days >= 14) return "fire";
  if (days >= 5) return "smoking";
  if (days >= 2) return "cracked";
  return days >= 1 ? "dusty" : "fine";
}
export type Health = ReturnType<typeof decay>;
export function buildingHealth(items: Item[], now: number): Health {
  const stages: Health[] = [
    "fine",
    "snoozed",
    "dusty",
    "cracked",
    "smoking",
    "fire",
  ];
  return items.reduce<Health>((worst, item) => {
    const state = decay(item, now);
    return stages.indexOf(state) > stages.indexOf(worst) ? state : worst;
  }, "fine");
}
