import { getDb, initDb } from '../../lib/db';
import { hashPassword } from '../../lib/bcrypt';
import { generateToken } from '../../lib/jwt';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { username, email, password, interestTags } = await req.json();

    if (!username || !email || !password) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    initDb();

    const db = getDb();

    const existingUser = db.prepare(`
      SELECT * FROM users WHERE username = ? OR email = ?
    `).get(username, email);

    if (existingUser) {
      db.close();
      return new Response(JSON.stringify({ error: 'User already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const hashedPassword = await hashPassword(password);

    const result = db.prepare(`
      INSERT INTO users (username, email, password, interest_tags)
      VALUES (?, ?, ?, ?)
    `).run(username, email, hashedPassword, JSON.stringify(interestTags || []));

    const user = db.prepare(`
      SELECT id, username, email, interest_tags, created_at FROM users WHERE id = ?
    `).get(result.lastInsertRowid);

    db.close();

    const token = generateToken(user);

    return new Response(JSON.stringify({ user, token }), {
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
