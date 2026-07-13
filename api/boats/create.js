import { getDb, initDb } from '../../lib/db';
import { authenticate } from '../../lib/jwt';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const user = await authenticate(req);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { content, pathType, latitude, longitude } = await req.json();

    if (!content || !pathType) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    initDb();

    const db = getDb();

    const result = db.prepare(`
      INSERT INTO paper_boats (user_id, content, path_type, latitude, longitude)
      VALUES (?, ?, ?, ?, ?)
    `).run(user.id, content, pathType, latitude || null, longitude || null);

    const boat = db.prepare(`
      SELECT id, content, path_type, status, created_at FROM paper_boats WHERE id = ?
    `).get(result.lastInsertRowid);

    db.close();

    return new Response(JSON.stringify(boat), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
