import { getDb, initDb } from '../../lib/db';
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

    await initDb();

    const client = await getDb();

    const result = await client.sql`
      SELECT pb.id, pb.content, pb.path_type, pb.status, pb.created_at,
             u.username as author_username
      FROM paper_boats pb
      JOIN users u ON pb.user_id = u.id
      WHERE pb.status = 'drifting' AND pb.user_id != ${user.id}
      ORDER BY pb.created_at DESC
      LIMIT 10
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
