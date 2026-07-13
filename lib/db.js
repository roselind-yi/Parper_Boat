// 导入 Upstash Redis 客户端
import { Redis } from '@upstash/redis';

// 创建 Redis 客户端实例
// 从环境变量中读取 UPSTASH_REDIS_REST_URL 和 UPSTASH_REDIS_REST_TOKEN
// 或者使用 KV_REST_API_URL 和 KV_REST_API_TOKEN（Vercel KV 兼容）
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

// 通过邮箱查找用户
export async function getUserByEmail(email) {
  const userId = await redis.get(`user:email:${email}`);
  if (!userId) return null;
  return redis.get(`user:${userId}`);
}

// 通过用户名查找用户
export async function getUserByUsername(username) {
  const userId = await redis.get(`user:username:${username}`);
  if (!userId) return null;
  return redis.get(`user:${userId}`);
}

// 创建新用户
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
  
  await redis.set(`user:${userId}`, user);
  await redis.set(`user:email:${email}`, userId);
  await redis.set(`user:username:${username}`, userId);
  
  return user;
}

// 创建漂流瓶
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
  
  await redis.set(`boat:${boatId}`, boat);
  await redis.lpush('boats:all', boatId);
  await redis.lpush(`user:${userId}:boats`, boatId);
  
  return boat;
}

// 查找漂流中的瓶子
export async function findBoats(userId, limit = 10) {
  const allBoatIds = await redis.lrange('boats:all', 0, -1);
  const boats = [];
  
  for (const boatId of allBoatIds) {
    if (boats.length >= limit) break;
    const boat = await redis.get(`boat:${boatId}`);
    if (boat && boat.status === 'drifting' && boat.userId !== userId) {
      const author = await redis.get(`user:${boat.userId}`);
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

// 获取我的漂流瓶
export async function getMyBoats(userId) {
  const boatIds = await redis.lrange(`user:${userId}:boats`, 0, -1);
  const boats = [];
  
  for (const boatId of boatIds) {
    const boat = await redis.get(`boat:${boatId}`);
    if (boat) {
      const interactionCount = await redis.llen(`boat:${boatId}:interactions`);
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

// 互动漂流瓶
export async function interactBoat(boatId, userId, type, replyContent) {
  const interaction = {
    id: Date.now().toString(),
    boatId,
    userId,
    type,
    replyContent: replyContent || null,
    createdAt: new Date().toISOString(),
  };
  
  await redis.lpush(`boat:${boatId}:interactions`, interaction);
  
  if (type === 'pickup') {
    const boat = await redis.get(`boat:${boatId}`);
    if (boat) {
      boat.status = 'picked';
      boat.updatedAt = new Date().toISOString();
      await redis.set(`boat:${boatId}`, boat);
    }
  }
  
  return true;
}

// 添加好友
export async function addFriend(userId, friendId) {
  const relation = {
    id: Date.now().toString(),
    userId,
    friendId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  await redis.set(`friend:${userId}:${friendId}`, relation);
  await redis.lpush(`user:${userId}:friends`, friendId);
  
  return true;
}

// 获取好友列表
export async function getFriends(userId) {
  const friendIds = await redis.lrange(`user:${userId}:friends`, 0, -1);
  const friends = [];
  
  for (const friendId of friendIds) {
    const relation = await redis.get(`friend:${userId}:${friendId}`);
    if (relation && relation.status === 'accepted') {
      const user = await redis.get(`user:${friendId}`);
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
