import { z } from 'zod';

const label = z.string().trim().min(1);
export const District = z.enum(['money', 'people', 'work', 'paperwork']);
export const Bot = z.enum(['mayor', 'banker', 'postmaster', 'secretary', 'clerk']);
export const keeperByDistrict = {
  money: 'banker',
  people: 'postmaster',
  work: 'secretary',
  paperwork: 'clerk',
} as const satisfies Record<z.infer<typeof District>, z.infer<typeof Bot>>;

export const GetTown = z.object({ district: District.optional() });
export const PlaceBuilding = z.object({
  entity: label,
  aliases: z.array(label).default([]),
  district: District,
  kind: label,
});
export const Building = PlaceBuilding.extend({
  id: label,
  plot: z.object({ x: z.number().int().nonnegative(), y: z.number().int().nonnegative() }),
  boarded: z.boolean().optional(),
});

const itemDetails = {
  building_id: label,
  title: label,
  due_at: z.iso.datetime({ offset: true }).optional(),
  state: z.enum(['open', 'snoozed', 'fixed']),
  thread_id: label,
  evidence: label.optional(),
};

export const SetState = z.object({
  ...itemDetails,
  item_id: label,
  bot: Bot.optional(),
}).refine(({ state, evidence }) => state !== 'fixed' || evidence !== undefined, {
  path: ['evidence'],
  message: 'A fixed item requires evidence of the completed action.',
});

export const Item = z.object({
  ...itemDetails,
  id: label,
  bot: Bot,
  updated_at: z.iso.datetime(),
});
export const WalkTo = z.object({ bot: Bot, building_id: label });

export const TownSnapshot = z.object({
  buildings: z.array(Building),
  items: z.array(Item),
  positions: z.array(WalkTo),
});

export const TownEvent = z.discriminatedUnion('type', [
  z.object({ type: z.literal('snapshot'), data: TownSnapshot }),
  z.object({ type: z.literal('building'), data: Building }),
  z.object({ type: z.literal('item'), data: Item }),
  z.object({ type: z.literal('walk'), data: WalkTo }),
]);

export type District = z.infer<typeof District>;
export type Building = z.infer<typeof Building>;
export type PlaceBuilding = z.infer<typeof PlaceBuilding>;
export type SetState = z.infer<typeof SetState>;
export type Item = z.infer<typeof Item>;
export type WalkTo = z.infer<typeof WalkTo>;
export type TownSnapshot = z.infer<typeof TownSnapshot>;
export type TownEvent = z.infer<typeof TownEvent>;
