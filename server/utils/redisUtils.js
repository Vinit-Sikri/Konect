// src/utils/redisUtils.js
const redis = require('redis');
const math = require('math');
const { redisConfig } = require('../config');

// ✅ FIX: TLS support for rediss://
const isSecureRedis = redisConfig.url.startsWith("rediss://");

const client = redis.createClient({
  url: redisConfig.url,
  socket: {
    reconnectStrategy: () => false,
    ...(isSecureRedis && {
      tls: true,
      rejectUnauthorized: false,
    }),
  },
});

let isRedisReady = false;
const userPresence = new Map();

client.on('error', err => {
  console.log('Redis Client Error ', err);
  isRedisReady = false;
});

client.connect()
  .then(() => {
    isRedisReady = true;
    console.log('✅ Successfully connected to Redis server!');

    process.on('SIGINT', () => {
      client.quit()
        .then(() => console.log('Disconnected from Redis server'))
        .catch(err => console.error('Error disconnecting from Redis: ', err));
    });
  })
  .catch(err => {
    isRedisReady = false;
    console.error('❌ Error connecting to Redis, continuing without cache:', err.message);
  });

async function saveMessageToRedis(roomName, message) {
  if (!isRedisReady) return;
  const key = `room_name_${roomName}`;
  try {
    await client.lPush(key, JSON.stringify(message));
  } catch (error) {
    console.error("Error saving message to Redis:", error);
  }
}

async function cacheRecentMessages(roomName, messages) {
  if (!isRedisReady) return;
  const key = `room_name_${roomName}`;
  try {
    for (const message of messages) {
      await client.rPush(key, JSON.stringify(message));
    }
  } catch (error) {
    console.error('Error caching messages:', error);
  }
}

async function getRecentMessages(roomName, count) {
  if (!isRedisReady) return [];
  const key = `room_name_${roomName}`;
  const listLength = await client.lLen(key);
  let limit = math.min(listLength, count - 1);
  const messages = await client.lRange(key, 0, limit);
  return messages.map((message) => JSON.parse(message));
}

const setUserActive = async (socketId, roomName, userMail) => {
  if (isRedisReady) {
    await client.hSet(socketId, { roomName, userMail });
    await AddOnlineUsers(roomName, userMail);
    return;
  }
  userPresence.set(socketId, { roomName, userMail });
  await AddOnlineUsers(roomName, userMail);
};

const setUserOffline = async (socketId) => {
  let roomName;
  let userMail;

  if (isRedisReady) {
    const res = await client.hGetAll(socketId);
    roomName = res.roomName;
    userMail = res.userMail;
  } else {
    const presence = userPresence.get(socketId) || {};
    roomName = presence.roomName;
    userMail = presence.userMail;
  }

  try {
    if (roomName && userMail) {
      await DeleteOnlineUsers(roomName, userMail);
    }

    if (isRedisReady) {
      await client.del(socketId);
    } else {
      userPresence.delete(socketId);
    }

    return { userMail, roomName };
  } catch (e) {
    console.log("Error occurred ", e);
  }
};

const getOnlineUsers = async (roomName) => {
  let key = `${roomName}_online_members`;

  if (!isRedisReady) {
    const users = [];
    for (const presence of userPresence.values()) {
      if (presence.roomName === roomName) {
        users.push(presence.userMail);
      }
    }
    return [...new Set(users)];
  }

  try {
    return await client.sMembers(key);
  } catch (error) {
    console.error("Error getting online users:", error);
  }
};

const AddOnlineUsers = async (roomName, memberEmail) => {
  if (!isRedisReady) return;
  let key = `${roomName}_online_members`;
  try {
    await client.sAdd(key, memberEmail);
  } catch (error) {
    console.error("Error saving message to Redis:", error);
  }
};

const DeleteOnlineUsers = async (roomName, memberEmail) => {
  if (!isRedisReady) return;
  let key = `${roomName}_online_members`;
  try {
    await client.sRem(key, memberEmail);
  } catch (error) {
    console.error("Error deleting from Redis:", error);
  }
};

module.exports = {
  saveMessageToRedis,
  getRecentMessages,
  cacheRecentMessages,
  getOnlineUsers,
  setUserActive,
  setUserOffline
};