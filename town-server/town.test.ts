import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { serve } from '@hono/node-server';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Building, TownSnapshot } from '../shared/town.ts';
import { readFixture } from '../fixtures/towns.ts';
import { createApp } from './app.ts';
import { TownStore } from './store.ts';

const hdfc = { entity: 'HDFC', district: 'money', kind: 'bank', aliases: ['HDFCBK'] } as const;

test('reuses normalized aliases and persists the plot without moving neighboring buildings', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bot-life-'));
  const path = join(dir, 'town.sqlite');
  const first = new TownStore(path);
  try {
    const original = first.placeBuilding({ ...hdfc, aliases: [...hdfc.aliases] });
    const same = first.placeBuilding({ ...hdfc, district: 'work', entity: ' ｈｄｆｃｂｋ ', aliases: ['HDFC Bank'] });
    assert.equal(same.id, original.id);
    assert.equal(same.district, original.district);
    assert.deepEqual(same.plot, original.plot);
    const other = first.placeBuilding({ ...hdfc, entity: 'Other bank', aliases: [] });
    assert.notDeepEqual(other.plot, original.plot);

    const second = new TownStore(path);
    try {
      const reloaded = second.placeBuilding({ ...hdfc, entity: 'hdfc bank', aliases: [] });
      assert.deepEqual(reloaded.plot, original.plot);
      assert.throws(() => second.placeBuilding({
        ...hdfc, entity: 'Conflicting bank', aliases: ['HDFCBK', 'Other bank'],
      }), /match multiple buildings/);
      assert.equal(second.get('money').buildings.length, 2);
    } finally {
      second.close();
    }
  } finally {
    first.close();
    rmSync(dir, { recursive: true });
  }
});

test('fresh, busy, and inferno have the expected landmark and overdue states', () => {
  const fresh = readFixture('fresh');
  assert.equal(fresh.buildings.length, 5);
  assert.ok(fresh.buildings.every(({ boarded }) => boarded));
  assert.equal(fresh.items.length, 0);

  const busy = readFixture('busy');
  assert.ok(busy.items.some(({ due_at }) => due_at && Date.parse(due_at) > Date.parse(busy.now)));
  assert.ok(busy.items.some(({ state }) => state === 'snoozed'));

  const inferno = readFixture('inferno');
  assert.equal(inferno.items.length, busy.items.length);
  assert.ok(inferno.items.every(({ state, due_at }) =>
    state === 'open' && due_at && Date.parse(due_at) < Date.parse(inferno.now)));
});

test('all town MCP tools work over HTTP and send state changes over browser SSE', { timeout: 10000 }, async ({ signal }) => {
  const store = new TownStore(':memory:');
  const app = createApp(store);
  const server = serve({ fetch: app.fetch, hostname: '127.0.0.1', port: 0 });
  const client = new Client({ name: 'town-test', version: '1.0.0' });
  const abort = new AbortController();

  try {
    if (!server.listening) await once(server, 'listening', { signal });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const base = `http://127.0.0.1:${address.port}`;
    const response = await fetch(`${base}/api/events`, { signal: AbortSignal.any([signal, abort.signal]) });
    assert.equal(response.status, 200);
    const reader = response.body?.pipeThrough(new TextDecoderStream()).getReader();
    assert.ok(reader);
    let pending = '';
    async function nextEvent(expected: string) {
      assert.ok(reader);
      while (!pending.includes('\n\n')) {
        const chunk = await reader.read();
        assert.ok(!chunk.done, `Stream ended before ${expected}`);
        pending += chunk.value;
      }
      const end = pending.indexOf('\n\n');
      const frame = pending.slice(0, end);
      pending = pending.slice(end + 2);
      assert.ok(frame.split('\n').includes(`event: ${expected}`), frame);
    }
    await nextEvent('snapshot');

    await client.connect(new StreamableHTTPClientTransport(new URL('/mcp', base)));
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map(({ name }) => name), [
      'town.get', 'town.place_building', 'town.set_state', 'town.walk_to',
    ]);
    const placed = await client.callTool({ name: 'town.place_building', arguments: hdfc });
    assert.equal(placed.isError, undefined);
    const building = Building.parse(placed.structuredContent);
    await nextEvent('building');

    const item = { building_id: building.id, item_id: 'bill', title: 'Pay bill', thread_id: 'thread' };
    const open = await client.callTool({ name: 'town.set_state', arguments: { ...item, state: 'open' } });
    assert.equal(open.isError, undefined);
    await nextEvent('item');

    const invalidFix = await client.callTool({ name: 'town.set_state', arguments: { ...item, state: 'fixed' } });
    assert.equal(invalidFix.isError, true);
    assert.equal(store.get().items[0]?.state, 'open');

    const walk = await client.callTool({
      name: 'town.walk_to', arguments: { building_id: building.id, bot: 'banker' },
    });
    assert.equal(walk.isError, undefined);
    await nextEvent('walk');

    const fixed = await client.callTool({
      name: 'town.set_state', arguments: { ...item, state: 'fixed', evidence: 'receipt-1' },
    });
    assert.equal(fixed.isError, undefined);
    await nextEvent('item');

    const town = await client.callTool({ name: 'town.get', arguments: { district: 'money' } });
    assert.deepEqual(TownSnapshot.parse(town.structuredContent), {
      buildings: [building], items: [], positions: [{ building_id: building.id, bot: 'banker' }],
    });
    const snapshot = await fetch(`${base}/api/town`);
    assert.equal(TownSnapshot.parse(await snapshot.json()).items[0]?.evidence, 'receipt-1');

    const blocked = await fetch(`${base}/api/town`, { headers: { origin: 'https://example.com' } });
    assert.equal(blocked.status, 403);
  } finally {
    abort.abort();
    await client.close();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
      if ('closeAllConnections' in server) server.closeAllConnections();
    });
    store.close();
  }
});
