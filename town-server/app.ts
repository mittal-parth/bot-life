import { EventEmitter } from 'node:events';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { GetTown, PlaceBuilding, SetState, WalkTo } from '../shared/town.ts';
import type { TownEvent } from '../shared/town.ts';
import { FixtureName, readFixture } from '../fixtures/towns.ts';
import type { TownStore } from './store.ts';

const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]']);

function isLoopback(url: string): boolean {
  try {
    return loopbackHosts.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

function result(data: object) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data) }],
    structuredContent: { ...data },
  };
}

function createMcp(store: TownStore, publish: (event: TownEvent) => void) {
  const server = new McpServer({ name: 'town', version: '0.1.0' });
  server.registerTool('town.get', {
    description: 'Find existing buildings and their open or snoozed items before updating the town.',
    inputSchema: GetTown,
  }, ({ district }) => {
    const snapshot = store.get(district);
    return result({ ...snapshot, items: snapshot.items.filter(({ state }) => state !== 'fixed') });
  });
  server.registerTool('town.place_building', {
    description: 'Create a building or reuse one with a matching entity name or alias.',
    inputSchema: PlaceBuilding,
  }, (input) => {
    const data = store.placeBuilding(input);
    publish({ type: 'building', data });
    return result(data);
  });
  server.registerTool('town.set_state', {
    description: 'Open, snooze, or fix an item. A fixed item requires evidence of the completed action.',
    inputSchema: SetState,
  }, (input) => {
    const data = store.setState(input);
    publish({ type: 'item', data });
    return result(data);
  });
  server.registerTool('town.walk_to', {
    description: 'Move a keeper or the mayor to a building.',
    inputSchema: WalkTo,
  }, (input) => {
    const data = store.walkTo(input);
    publish({ type: 'walk', data });
    return result(data);
  });
  return server;
}

export function createApp(store: TownStore) {
  const events = new EventEmitter();
  events.setMaxListeners(0);
  const app = new Hono();

  app.use('*', async (context, next) => {
    const origin = context.req.header('origin');
    if (!isLoopback(context.req.url) || (origin !== undefined && origin !== new URL(context.req.url).origin)) {
      return context.json({ error: 'Only loopback requests are accepted.' }, 403);
    }
    await next();
  });

  app.get('/api/town', (context) => {
    const query = GetTown.safeParse({ district: context.req.query('district') });
    if (!query.success) return context.json({ error: 'Unknown district.' }, 400);
    return context.json(store.get(query.data.district));
  });

  app.get('/api/fixtures/:name', (context) => {
    const name = FixtureName.safeParse(context.req.param('name'));
    if (!name.success) return context.json({ error: 'Unknown fixture.' }, 404);
    return context.json(readFixture(name.data));
  });

  app.get('/api/events', (context) => streamSSE(context, async (stream) => {
    const write = (event: TownEvent) => stream.writeSSE({ event: event.type, data: JSON.stringify(event.data) });
    await new Promise<void>((resolve) => {
      const listener = (event: TownEvent) => { void write(event); };
      const heartbeat = setInterval(() => { void stream.writeSSE({ event: 'ping', data: '' }); }, 15_000);
      events.on('town', listener);
      stream.onAbort(() => {
        clearInterval(heartbeat);
        events.off('town', listener);
        resolve();
      });
      void write({ type: 'snapshot', data: store.get() });
    });
  }));

  app.post('/mcp', async (context) => {
    const server = createMcp(store, (event) => events.emit('town', event));
    const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
    try {
      await server.connect(transport);
      return await transport.handleRequest(context.req.raw);
    } finally {
      await server.close();
    }
  });

  app.on(['GET', 'DELETE'], '/mcp', (context) => {
    context.header('Allow', 'POST');
    return context.json({ jsonrpc: '2.0', id: null, error: { code: -32000, message: 'Method not allowed.' } }, 405);
  });

  return app;
}
