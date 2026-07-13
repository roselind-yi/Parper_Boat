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

    const { friendId } = await req.json();

    if (!friendId || friendId === user.id) {
      return new Response(JSON.stringify({ error: 'Invalid friend ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    initDb();

    const db = getDb();

    const existingRelation = db.prepare(`
      SELECT * FROM friend_relations 
      WHERE (user_id = ? AND friend_id = ?) 
         OR (user_id = ? AND friend_id = ?)
    `).get(user.id, friendId, friendId, user.id);

    if (existingRelation) {
      db.close();
      return new Response(JSON.stringify({ error: 'Friend request already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    db.prepare(`
      INSERT INTO friend_relations (user_id, friend_id, status)
      VALUES (?, ?, 'pending')
    `).run(user.id, friendId);

    db.close();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
