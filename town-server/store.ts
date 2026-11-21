import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { Building, Item, SetState, WalkTo, keeperByDistrict } from '../shared/town.ts';
import type { District, PlaceBuilding, TownSnapshot } from '../shared/town.ts';

export const plotWidth = 8;
export const plotHeight = 8;
const plotCount = plotWidth * plotHeight;

function aliasKey(alias: string): string {
  return alias.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLowerCase();
}

function hash(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

export class TownStore {
  private readonly db: DatabaseSync;

  constructor(path: string) {
    this.db = new DatabaseSync(path, { timeout: 5000 });
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS buildings (
        id TEXT PRIMARY KEY, district TEXT NOT NULL, plot INTEGER NOT NULL, data TEXT NOT NULL,
        UNIQUE (district, plot)
      );
      CREATE TABLE IF NOT EXISTS aliases (
        key TEXT PRIMARY KEY, building_id TEXT NOT NULL REFERENCES buildings(id)
      );
      CREATE TABLE IF NOT EXISTS items (
        building_id TEXT NOT NULL REFERENCES buildings(id), id TEXT NOT NULL, data TEXT NOT NULL,
        PRIMARY KEY (building_id, id)
      );
      CREATE TABLE IF NOT EXISTS positions (
        bot TEXT PRIMARY KEY, building_id TEXT NOT NULL REFERENCES buildings(id)
      );
    `);
  }

  transaction<T>(action: () => T): T {
    if (this.db.isTransaction) return action();
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = action();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  close(): void {
    this.db.close();
  }

  get(district?: District): TownSnapshot {
    const buildings = (district === undefined
      ? this.db.prepare('SELECT data FROM buildings ORDER BY district, plot').all()
      : this.db.prepare('SELECT data FROM buildings WHERE district = ? ORDER BY plot').all(district)
    ).map(({ data }) => Building.parse(JSON.parse(String(data))));
    const visible = new Set(buildings.map(({ id }) => id));

    const items = this.db.prepare('SELECT building_id, data FROM items ORDER BY building_id, id').all()
      .filter(({ building_id }) => visible.has(String(building_id)))
      .map(({ data }) => Item.parse(JSON.parse(String(data))));
    const positions = this.db.prepare('SELECT bot, building_id FROM positions ORDER BY bot').all()
      .filter(({ building_id }) => visible.has(String(building_id)))
      .map((row) => WalkTo.parse(row));
    return { buildings, items, positions };
  }

  placeBuilding(input: PlaceBuilding, landmark?: { plot: Building['plot']; boarded: boolean }): Building {
    return this.transaction(() => {
      const aliases = new Map([input.entity, ...input.aliases].map((name) => [aliasKey(name), name]));
      const findAlias = this.db.prepare('SELECT building_id FROM aliases WHERE key = ?');
      const matches = new Set([...aliases.keys()].flatMap((key) => {
        const row = findAlias.get(key);
        return row ? [String(row.building_id)] : [];
      }));
      if (matches.size > 1) throw new Error('Aliases match multiple buildings.');

      const [existingId] = matches;
      let building: Building;
      if (existingId) {
        const existing = this.requireBuilding(existingId);
        const names = new Map(existing.aliases.map((name) => [aliasKey(name), name]));
        for (const [key, name] of aliases) {
          if (key !== aliasKey(existing.entity) && !names.has(key)) names.set(key, name);
        }
        building = { ...existing, aliases: [...names.values()] };
        this.db.prepare('UPDATE buildings SET data = ? WHERE id = ?').run(JSON.stringify(building), building.id);
      } else {
        const id = hash(aliasKey(input.entity)).toString('hex');
        const slot = landmark
          ? landmark.plot.y * plotWidth + landmark.plot.x
          : this.findPlot(id, input.district);
        aliases.delete(aliasKey(input.entity));
        building = {
          ...input,
          id,
          aliases: [...aliases.values()],
          plot: { x: slot % plotWidth, y: Math.floor(slot / plotWidth) },
          ...(landmark && { boarded: landmark.boarded }),
        };
        this.db.prepare('INSERT INTO buildings VALUES (?, ?, ?, ?)')
          .run(id, building.district, slot, JSON.stringify(building));
      }

      const addAlias = this.db.prepare('INSERT INTO aliases VALUES (?, ?) ON CONFLICT(key) DO NOTHING');
      addAlias.run(aliasKey(input.entity), building.id);
      for (const key of aliases.keys()) addAlias.run(key, building.id);
      return building;
    });
  }

  setState(input: SetState, now = new Date()): Item {
    const { item_id, ...details } = SetState.parse(input);
    const building = this.requireBuilding(details.building_id);
    const item: Item = {
      ...details,
      id: item_id,
      bot: details.bot ?? keeperByDistrict[building.district],
      updated_at: now.toISOString(),
    };
    this.db.prepare(`
      INSERT INTO items VALUES (?, ?, ?)
      ON CONFLICT(building_id, id) DO UPDATE SET data = excluded.data
    `).run(item.building_id, item.id, JSON.stringify(item));
    return item;
  }

  walkTo(position: WalkTo): WalkTo {
    this.requireBuilding(position.building_id);
    this.db.prepare(`
      INSERT INTO positions VALUES (?, ?)
      ON CONFLICT(bot) DO UPDATE SET building_id = excluded.building_id
    `).run(position.bot, position.building_id);
    return position;
  }

  private requireBuilding(id: string): Building {
    const row = this.db.prepare('SELECT data FROM buildings WHERE id = ?').get(id);
    if (!row) throw new Error('Building not found.');
    return Building.parse(JSON.parse(String(row.data)));
  }

  private findPlot(id: string, district: District): number {
    const taken = new Set(this.db.prepare('SELECT plot FROM buildings WHERE district = ?')
      .all(district).map(({ plot }) => Number(plot)));
    const start = hash(id).readUInt32BE(0) % plotCount;
    for (let offset = 0; offset < plotCount; offset++) {
      const slot = (start + offset) % plotCount;
      if (!taken.has(slot)) return slot;
    }
    throw new Error(`No vacant plots in ${district}.`);
  }
}
