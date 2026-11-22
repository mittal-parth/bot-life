import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { photoApi } from './photos.ts';
import { chatApi } from './omb/chat.ts';

test('gallery image reaches only the explicitly selected character through the native upload and message endpoints', async () => {
  const calls: string[] = [];
  const photos = photoApi();
  const bytes = Buffer.from('89504e470d0a1a0a', 'hex');
  const added = await photos.request('/?name=private.png', { method: 'POST', body: bytes });
  const { id: photoId } = await added.json();
  const sendId = randomUUID();
  const question = 'What do you see?';
  const app = chatApi(async (input, init) => {
    const url = new URL(String(input));
    calls.push(url.pathname);
    if (url.pathname === '/api/bots') return Response.json({ bots: [{ id: 'worker', threadId: 'thread' }] });
    if (url.pathname === '/api/attachments') {
      assert.equal(url.searchParams.get('uploadId'), sendId);
      assert.equal(new Headers(init?.headers).get('Content-Type'), 'image/png');
      assert.deepEqual(Buffer.from(init?.body as ArrayBuffer), bytes);
      return Response.json({ path: '/attachments/sample.png' });
    }
    assert.equal(url.pathname, '/api/bots/worker/messages');
    assert.deepEqual(JSON.parse(String(init?.body)), { threadId: 'thread', sendId, text: question + '\n\n<attached-image path="/attachments/sample.png" />' });
    return Response.json({ threadId: 'thread' });
  }, undefined, async id => photos.request('/' + id + '/image'));
  const send = (threadId: string) => app.request('/photo-turns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photoId, sendId, botId: 'worker', threadId, question }) });
  assert.equal((await send('old-thread')).status, 409);
  assert.deepEqual(calls, ['/api/bots']);
  assert.equal((await send('thread')).status, 200);
  assert.deepEqual(calls, ['/api/bots', '/api/bots', '/api/attachments', '/api/bots/worker/messages']);
});
