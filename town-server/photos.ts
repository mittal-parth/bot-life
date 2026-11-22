import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { photoLimit } from '../shared/photos.ts';

function imageType(bytes: Buffer) {
  if (bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return 'image/png';
  if (bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'))) return 'image/jpeg';
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

export function photoApi(photoDir?: string) {
  const api = new Hono();
  let database: DatabaseSync;
  function db() {
    if (!database) {
      if (photoDir) mkdirSync(photoDir, { recursive: true, mode: 0o700 });
      database = new DatabaseSync(photoDir ? join(photoDir, 'photos.sqlite') : ':memory:');
      database.exec('CREATE TABLE IF NOT EXISTS photos (id TEXT PRIMARY KEY, name TEXT, note TEXT, added TEXT, mime TEXT, bytes BLOB)');
    }
    return database;
  }
  api.use('*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    c.header('X-Content-Type-Options', 'nosniff');
    await next();
  });
  api.get('/', c => c.json({ photos: db().prepare('SELECT id,name,note,added FROM photos ORDER BY added DESC, rowid DESC').all() }));
  api.post('/', bodyLimit({ maxSize: photoLimit, onError: c => c.json({ error: 'Choose a photo under 12 MB.' }, 413) }), async c => {
    const bytes = Buffer.from(await c.req.arrayBuffer());
    const mime = imageType(bytes);
    if (!mime) return c.json({ error: 'Choose a JPEG, PNG or WebP image.' }, 415);
    const name = c.req.query('name')?.split(/[\\/]/).pop()?.slice(0, 240).trim() || 'Untitled photo';
    const photo = { id: randomUUID(), name, note: '', added: new Date().toISOString() };
    db().prepare('INSERT INTO photos VALUES (?, ?, ?, ?, ?, ?)').run(photo.id, name, '', photo.added, mime, bytes);
    return c.json(photo, 201);
  });
  api.get('/:id/image', c => {
    const record = db().prepare('SELECT bytes,mime FROM photos WHERE id=?').get(c.req.param('id'));
    if (!record) return c.json({ error: 'Photo missing.' }, 404);
    return c.body(new Uint8Array(record.bytes as Uint8Array), 200, { 'Content-Type': String(record.mime) });
  });
  api.patch('/:id', bodyLimit({ maxSize: 12_000 }), async c => {
    const body = await c.req.json().catch(() => null);
    if (typeof body?.note !== 'string' || body.note.length > 2000) return c.json({ error: 'Keep the note under 2,000 characters.' }, 400);
    const result = db().prepare('UPDATE photos SET note=? WHERE id=?').run(body.note.trim(), c.req.param('id'));
    return result.changes ? c.json({ note: body.note.trim() }) : c.json({ error: 'Photo missing.' }, 404);
  });
  api.delete('/:id', c => {
    const result = db().prepare('DELETE FROM photos WHERE id=?').run(c.req.param('id'));
    return result.changes ? c.body(null, 204) : c.json({ error: 'Photo missing.' }, 404);
  });
  return api;
}
