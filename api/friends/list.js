import { getDb } from '../../lib/db';
import { authenticate } from '../../lib/jwt';

export default async function handler(req) {
  if (req.method !== 'GET') {
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

    const client = await getDb();

    const result = await client.sql`
      SELECT u.id, u.username, u.email, fr.status, fr.created_at
      FROM friend_relations fr
      JOIN users u ON (fr.user_id = ${user.id} AND fr.friend_id = u.id) 
                   OR (fr.friend_id = ${user.id} AND fr.user_id = u.id)
      WHERE u.id != ${user.id} AND fr.status = 'accepted'
      ORDER BY fr.created_at DESC
    `;

    await client.end();

    return new Response(JSON.stringify(result.rows), {
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
