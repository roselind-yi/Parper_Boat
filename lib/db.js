import { createClient } from '@vercel/postgres';

export async function getDb() {
  const client = createClient({
    connectionString: process.env.POSTGRES_URL,
  });
  await client.connect();
  return client;
}

export async function initDb() {
  const client = await getDb();
  
  await client.sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      interest_tags TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await client.sql`
    CREATE TABLE IF NOT EXISTS paper_boats (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      content TEXT NOT NULL,
      path_type VARCHAR(20) NOT NULL,
      status VARCHAR(20) DEFAULT 'drifting',
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await client.sql`
    CREATE TABLE IF NOT EXISTS interactions (
      id SERIAL PRIMARY KEY,
      boat_id INTEGER REFERENCES paper_boats(id),
      user_id INTEGER REFERENCES users(id),
      type VARCHAR(20) NOT NULL,
      reply_content TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await client.sql`
    CREATE TABLE IF NOT EXISTS friend_relations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      friend_id INTEGER REFERENCES users(id),
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, friend_id)
    );
  `;
  
  await client.end();
}
