import assert from "node:assert/strict";
import test from "node:test";
import type { Item } from "../shared/town.ts";
import { buildingHealth, day, decay } from "./health.ts";

test("decay follows due dates and respects snoozed and resolved work", () => {
  const item: Item = {
    id: "a",
    building_id: "b",
    title: "Bill",
    state: "open",
    bot: "banker",
    thread_id: "t",
    due_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  };
  assert.deepEqual(
    [-1, 0, 1, 2, 5, 14].map((days) => decay(item, days * day)),
    ["fine", "fine", "dusty", "cracked", "smoking", "fire"],
  );
  assert.equal(decay({ ...item, due_at: undefined }, 100 * day), "fine");
  assert.equal(decay({ ...item, state: "fixed" }, 100 * day), "fine");
  assert.equal(
    buildingHealth([{ ...item, state: "snoozed" }, item], 6 * day),
    "smoking",
  );
});
