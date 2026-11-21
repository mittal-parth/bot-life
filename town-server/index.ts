import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { serve } from '@hono/node-server';
import { FixtureName, seedTown } from '../fixtures/towns.ts';
import { createApp } from './app.ts';
import { TownStore } from './store.ts';

const path = process.env.TOWN_DB ?? '.town/town.sqlite';
const port = Number(process.env.TOWN_PORT ?? 4310);
const fixture = FixtureName.parse(process.env.TOWN_FIXTURE ?? 'fresh');
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid TOWN_PORT.');
if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });

const store = new TownStore(path);
seedTown(store, fixture);
const app = createApp(store);
const server = serve({ fetch: app.fetch, hostname: '127.0.0.1', port }, (info) => {
  console.log(`Town server listening at http://127.0.0.1:${info.port}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    server.close(() => store.close());
    if ('closeAllConnections' in server) server.closeAllConnections();
  });
}
