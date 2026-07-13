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

    const db = getDb();

    const boats = db.prepare(`
      SELECT pb.id, pb.content, pb.path_type, pb.status, pb.created_at, pb.updated_at,
             COUNT(i.id) as interaction_count
      FROM paper_boats pb
      LEFT JOIN interactions i ON pb.id = i.boat_id
      WHERE pb.user_id = ?
      GROUP BY pb.id, pb.content, pb.path_type, pb.status, pb.created_at, pb.updated_at
      ORDER BY pb.created_at DESC
    `).all(user.id);

    db.close();

    return new Response(JSON.stringify(boats), {
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
