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

    await initDb();

    const client = await getDb();

    const existingRelation = await client.sql`
      SELECT * FROM friend_relations 
      WHERE (user_id = ${user.id} AND friend_id = ${friendId}) 
         OR (user_id = ${friendId} AND friend_id = ${user.id})
    `;

    if (existingRelation.rows.length > 0) {
      await client.end();
      return new Response(JSON.stringify({ error: 'Friend request already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await client.sql`
      INSERT INTO friend_relations (user_id, friend_id, status)
      VALUES (${user.id}, ${friendId}, 'pending')
    `;

    await client.end();

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
