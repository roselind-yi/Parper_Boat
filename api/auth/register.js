import { getUserByEmail, getUserByUsername, createUser } from '../../lib/db.js';
import { hashPassword } from '../../lib/bcrypt.js';
import { generateToken } from '../../lib/jwt.js';

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

    const existingEmail = await getUserByEmail(email);
    if (existingEmail) {
      return new Response(JSON.stringify({ error: '该邮箱已注册' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existingUsername = await getUserByUsername(username);
    if (existingUsername) {
      return new Response(JSON.stringify({ error: '该用户名已被使用' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const hashedPassword = await hashPassword(password);
    const user = await createUser(username, email, hashedPassword);

    const token = generateToken(user);

    return new Response(JSON.stringify({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        interest_tags: user.interestTags,
        created_at: user.createdAt,
      },
      token,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('注册错误详情:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
