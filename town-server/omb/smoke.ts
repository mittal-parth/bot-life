import { randomUUID } from 'node:crypto';
import { TownSnapshot } from '../../shared/town.ts';

function localBase(value: string): URL {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid local server port.');
  return new URL(`http://127.0.0.1:${port}`);
}

async function checkedFetch(url: URL, init: RequestInit): Promise<Response> {
  const response = await fetch(url, { ...init, redirect: 'error' });
  if (!response.ok) throw new Error(`${init.method ?? 'GET'} ${url.pathname} returned HTTP ${response.status}`);
  return response;
}

async function* dataFrames(response: Response) {
  if (!response.body) throw new Error('OpenMausBot event stream is empty.');
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let pending = '';
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) throw new Error('OpenMausBot event stream ended.');
      pending += chunk.value.replaceAll('\r', '');
      let boundary = pending.indexOf('\n\n');
      while (boundary !== -1) {
        const data = pending.slice(0, boundary).split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart()).join('\n');
        pending = pending.slice(boundary + 2);
        if (data) yield JSON.parse(data) as {
          kind: string;
          threadId?: string;
          message?: { role?: string; text?: string };
        };
        boundary = pending.indexOf('\n\n');
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
}

const [botId, threadId] = process.argv.slice(2);
if (!botId || !threadId || !/^[\w-]+$/.test(botId) || !/^[\w-]+$/.test(threadId)) {
  throw new Error('Usage: pnpm smoke:omb <bot-id> <thread-id>');
}

const harness = localBase(process.env.OMB_PORT ?? '8799');
const town = localBase(process.env.TOWN_PORT ?? '4310');
const token = process.env.OMB_SESSION_TOKEN;
const auth = token ? { Authorization: `Bearer ${token}` } : undefined;
const controller = new AbortController();
const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(120_000)]);
const marker = randomUUID();
const entity = `Town MCP check ${marker}`;
const townSnapshot = async () => TownSnapshot.parse(
  await (await checkedFetch(new URL('/api/town', town), { signal })).json(),
);

await townSnapshot();
const stream = await checkedFetch(new URL('/api/events?screens=off&frames=thread', harness), {
  headers: { ...auth, Accept: 'text/event-stream' },
  signal,
});
const frames = dataFrames(stream);

try {
  const first = await frames.next();
  if (first.value?.kind !== 'hello') throw new Error('Expected the OpenMausBot hello frame.');
  const send = await checkedFetch(new URL(`/api/bots/${botId}/messages`, harness), {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      threadId,
      sendId: marker,
      text: `Use the town MCP tool town.place_building to place "${entity}" in the work district with kind "office" and no aliases. When the tool succeeds, reply with "Town check complete ${marker}".`,
    }),
  });
  const receipt = await send.json();
  if (receipt.threadId !== threadId) throw new Error('OpenMausBot accepted the message into a different thread.');

  for await (const frame of frames) {
    if ((frame.kind === 'message' || frame.kind === 'message.patch') &&
        frame.threadId === threadId && frame.message?.role === 'bot' &&
        frame.message.text?.includes(`Town check complete ${marker}`)) {
      const snapshot = await townSnapshot();
      if (!snapshot.buildings.some((building) => building.entity === entity && building.district === 'work')) {
        throw new Error('The bot replied without creating the test building.');
      }
      console.log('OpenMausBot replied over SSE and placed the test building through town MCP.');
      break;
    }
  }
} finally {
  controller.abort();
  await frames.return(undefined);
}
