import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { photoApi } from './photos.ts';
import { photoCollections, photoLimit } from '../shared/photos.ts';

test('photos survive reopening, retain their original bytes, and support notes and removal', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'town-photos-'));
  try {
    const original = photoApi(directory);
    const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+nmZkAAAAASUVORK5CYII=', 'base64');
    const added = await original.request('/?name=goa_trip.png', { method: 'POST', body: bytes });
    assert.equal(added.status, 201);
    const { id } = await added.json();
    const app = photoApi(directory);
    const response = await app.request('/' + id + '/image');
    assert.equal(response.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
    assert.equal((await app.request('/' + id, { method: 'PATCH', body: JSON.stringify({ note: 'Train receipt' }) })).status, 200);
    const { photos } = await (await app.request('/')).json();
    assert.deepEqual(photoCollections(photos).map(group => group.title), ['Travel plans', 'Receipts & bills']);
    assert.equal((await app.request('/' + id, { method: 'DELETE' })).status, 204);
    assert.equal((await app.request('/' + id + '/image')).status, 404);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('unsupported and oversized uploads stay out of the gallery', async () => {
  const app = photoApi();
  assert.equal((await app.request('/?name=fake.png', { method: 'POST', body: '<svg/>' })).status, 415);
  assert.equal((await app.request('/', { method: 'POST', body: new Uint8Array(photoLimit + 1) })).status, 413);
  assert.deepEqual(await (await app.request('/')).json(), { photos: [] });
});
