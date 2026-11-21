import { z } from 'zod';
import type { District } from '../shared/town.ts';
import { TownStore } from '../town-server/store.ts';

export const FixtureName = z.enum(['fresh', 'busy', 'inferno']);
export type FixtureName = z.infer<typeof FixtureName>;
export const fixtureNow = new Date('2026-11-21T12:00:00Z');

const landmarks = [
  { entity: 'Town Hall', district: 'work', kind: 'town-hall', x: 2, y: 2 },
  { entity: 'Bank', district: 'money', kind: 'bank', x: 2, y: 2 },
  { entity: 'Telephone Exchange', district: 'people', kind: 'telephone-exchange', x: 2, y: 2 },
  { entity: 'Clock Tower', district: 'work', kind: 'clock-tower', x: 5, y: 2 },
  { entity: 'Post Office', district: 'paperwork', kind: 'post-office', x: 2, y: 2 },
] as const;

const examples: { entity: string; district: District; kind: string; title: string; days: number }[] = [
  { entity: 'HDFC', district: 'money', kind: 'bank', title: 'Pay credit card bill', days: -5 },
  { entity: 'Landlord', district: 'money', kind: 'rowhouse', title: 'Pay December rent', days: 10 },
  { entity: 'Mom', district: 'people', kind: 'house', title: 'Reply about Sunday lunch', days: -2 },
  { entity: 'Neha', district: 'people', kind: 'cottage', title: 'Send the photos', days: -1 },
  { entity: 'Studio', district: 'work', kind: 'office', title: 'Reply to the mockup feedback', days: -8 },
  { entity: 'Client', district: 'work', kind: 'workshop', title: 'Review the revised brief', days: 1 },
  { entity: 'Passport Office', district: 'paperwork', kind: 'office', title: 'Renew passport', days: -30 },
  { entity: 'Insurer', district: 'paperwork', kind: 'rowhouse', title: 'Renew home insurance', days: -1 },
];

export function seedTown(store: TownStore, fixture: FixtureName): void {
  store.transaction(() => {
    if (store.get().buildings.length > 0) return;
    for (const { x, y, ...building } of landmarks) {
      store.placeBuilding({ ...building, aliases: [] }, { plot: { x, y }, boarded: fixture === 'fresh' });
    }
    if (fixture === 'fresh') return;

    for (const [index, { title, days, ...input }] of examples.entries()) {
      const building = store.placeBuilding({ ...input, aliases: [] });
      const due = new Date(fixtureNow);
      due.setUTCDate(due.getUTCDate() + (fixture === 'inferno' ? -45 : days));
      store.setState({
        building_id: building.id,
        item_id: `fixture-${index}`,
        title,
        due_at: due.toISOString(),
        state: fixture === 'busy' && input.entity === 'Insurer' ? 'snoozed' : 'open',
        thread_id: `fixture-thread-${index}`,
      }, fixtureNow);
    }
  });
}

export function readFixture(fixture: FixtureName) {
  const store = new TownStore(':memory:');
  try {
    seedTown(store, fixture);
    return { ...store.get(), now: fixtureNow.toISOString() };
  } finally {
    store.close();
  }
}
