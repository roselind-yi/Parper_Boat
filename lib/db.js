import { kv } from '@vercel/kv';

export async function getUserByEmail(email) {
  const userId = await kv.get(`user:email:${email}`);
  if (!userId) return null;
  return kv.get(`user:${userId}`);
}

export async function getUserByUsername(username) {
  const userId = await kv.get(`user:username:${username}`);
  if (!userId) return null;
  return kv.get(`user:${userId}`);
}

export async function createUser(username, email, hashedPassword) {
  const userId = Date.now().toString();
  const user = {
    id: userId,
    username,
    email,
    password: hashedPassword,
    interestTags: [],
    createdAt: new Date().toISOString(),
  };
  
  await kv.set(`user:${userId}`, user);
  await kv.set(`user:email:${email}`, userId);
  await kv.set(`user:username:${username}`, userId);
  
  return user;
}

export async function createBoat(userId, content, pathType, latitude, longitude) {
  const boatId = Date.now().toString();
  const boat = {
    id: boatId,
    userId,
    content,
    pathType,
    status: 'drifting',
    latitude: latitude || null,
    longitude: longitude || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  await kv.set(`boat:${boatId}`, boat);
  await kv.lpush('boats:all', boatId);
  await kv.lpush(`user:${userId}:boats`, boatId);
  
  return boat;
}

export async function findBoats(userId, limit = 10) {
  const allBoatIds = await kv.lrange('boats:all', 0, -1);
  const boats = [];
  
  for (const boatId of allBoatIds) {
    if (boats.length >= limit) break;
    const boat = await kv.get(`boat:${boatId}`);
    if (boat && boat.status === 'drifting' && boat.userId !== userId) {
      const author = await kv.get(`user:${boat.userId}`);
      boats.push({
        id: boat.id,
        content: boat.content,
        path_type: boat.pathType,
        status: boat.status,
        created_at: boat.createdAt,
        author_username: author ? author.username : '匿名',
      });
    }
  }
  
  return boats;
}

export async function getMyBoats(userId) {
  const boatIds = await kv.lrange(`user:${userId}:boats`, 0, -1);
  const boats = [];
  
  for (const boatId of boatIds) {
    const boat = await kv.get(`boat:${boatId}`);
    if (boat) {
      const interactionCount = await kv.llen(`boat:${boatId}:interactions`);
      boats.push({
        id: boat.id,
        content: boat.content,
        path_type: boat.pathType,
        status: boat.status,
        created_at: boat.createdAt,
        updated_at: boat.updatedAt,
        interaction_count: interactionCount || 0,
      });
    }
  }
  
  return boats;
}

export async function interactBoat(boatId, userId, type, replyContent) {
  const interaction = {
    id: Date.now().toString(),
    boatId,
    userId,
    type,
    replyContent: replyContent || null,
    createdAt: new Date().toISOString(),
  };
  
  await kv.lpush(`boat:${boatId}:interactions`, interaction);
  
  if (type === 'pickup') {
    const boat = await kv.get(`boat:${boatId}`);
    if (boat) {
      boat.status = 'picked';
      boat.updatedAt = new Date().toISOString();
      await kv.set(`boat:${boatId}`, boat);
    }
  }
  
  return true;
}

export async function addFriend(userId, friendId) {
  const relation = {
    id: Date.now().toString(),
    userId,
    friendId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  await kv.set(`friend:${userId}:${friendId}`, relation);
  await kv.lpush(`user:${userId}:friends`, friendId);
  
  return true;
}

export async function getFriends(userId) {
  const friendIds = await kv.lrange(`user:${userId}:friends`, 0, -1);
  const friends = [];
  
  for (const friendId of friendIds) {
    const relation = await kv.get(`friend:${userId}:${friendId}`);
    if (relation && relation.status === 'accepted') {
      const user = await kv.get(`user:${friendId}`);
      if (user) {
        friends.push({
          id: user.id,
          username: user.username,
          email: user.email,
          status: relation.status,
          created_at: relation.createdAt,
        });
      }
    }
  }
  
  return friends;
}
