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

    const { boatId, type, replyContent } = await req.json();

    if (!boatId || !type) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!['pickup', 'reply', 'like'].includes(type)) {
      return new Response(JSON.stringify({ error: 'Invalid interaction type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    initDb();

    const db = getDb();

    db.prepare(`
      INSERT INTO interactions (boat_id, user_id, type, reply_content)
      VALUES (?, ?, ?, ?)
    `).run(boatId, user.id, type, replyContent || null);

    if (type === 'pickup') {
      db.prepare(`
        UPDATE paper_boats SET status = 'picked' WHERE id = ?
      `).run(boatId);
    }

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
