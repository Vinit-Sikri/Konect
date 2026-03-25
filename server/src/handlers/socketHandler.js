const { getRecentMessages, setUserActive, setUserOffline, getOnlineUsers } = require('../../utils/redisUtils');
const { saveMessage } = require('../repos/chatRoom');
const { verifyToken } = require('../../utils/jwtUtils');
const { produce } = require('../kafka/producer');
const { kafkaConfig } = require('../../config');

const socketHandler = (io) => {

  // ✅ AUTH MIDDLEWARE (FINAL FIX)
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        console.log("❌ No token in socket");
        return next(new Error("Unauthorized"));
      }

      const decoded = verifyToken(token);

      if (!decoded || !decoded.userMail) {
        console.log("❌ Invalid token payload");
        return next(new Error("Unauthorized"));
      }

      socket.userMail = decoded.userMail;
      socket.userId = decoded.userId;

      next();
    } catch (error) {
      console.error("❌ Socket auth error:", error.message);
      next(new Error("Unauthorized"));
    }
  });

  io.on('connection', (socket) => {
    console.log('🔥 User connected:', socket.userMail);

    const userMail = socket.userMail;

    // JOIN ROOM
    socket.on('joinRoom', async (data) => {
      try {
        const { roomName } = data;

        if (!roomName) return;

        socket.join(roomName);

        socket.emit('receiveMessage', `Welcome ${userMail} to ${roomName}`);

        await setUserActive(socket.id, roomName, userMail);

        const newMessage = prepareMessage(
          roomName,
          `${userMail} joined the room`,
          userMail,
          true
        );

        await publishMessage(io, newMessage, kafkaConfig.topic.CHAT_EVENTS);

        const users = await getOnlineUsers(roomName);

        io.to(roomName).emit('onlineUsers', {
          roomName,
          users,
        });

      } catch (err) {
        console.error("❌ joinRoom error:", err);
      }
    });

    // SEND MESSAGE
    socket.on('sendMessage', async (data) => {
      try {
        const { roomName, message } = data;

        if (!roomName || !message) return;

        const newMessage = prepareMessage(roomName, message, userMail, false);

        await publishMessage(io, newMessage, kafkaConfig.topic.CHAT_MESSAGES);

      } catch (err) {
        console.error("❌ sendMessage error:", err);
      }
    });

    // GET RECENT
    socket.on('getRecentMessages', async (data) => {
      try {
        const { roomName, count } = data;

        const messages = await getRecentMessages(roomName, count || 50);

        socket.emit('recentMessages', messages);

      } catch (err) {
        console.error("❌ recentMessages error:", err);
      }
    });

    // ONLINE USERS
    socket.on('getOnlineUsers', async (data) => {
      try {
        const { roomName } = data;

        const users = await getOnlineUsers(roomName);

        socket.emit('onlineUsers', {
          roomName,
          users,
        });

      } catch (err) {
        console.error("❌ onlineUsers error:", err);
      }
    });

    // DISCONNECT
    socket.on('disconnect', async () => {
      try {
        const result = await setUserOffline(socket.id);

        if (!result) return;

        const { userMail, roomName } = result;

        const newMessage = prepareMessage(
          roomName,
          `${userMail} left the room`,
          userMail,
          true
        );

        await publishMessage(io, newMessage, kafkaConfig.topic.CHAT_MESSAGES);

        const users = await getOnlineUsers(roomName);

        io.to(roomName).emit('onlineUsers', {
          roomName,
          users,
        });

        console.log(`❌ Disconnected: ${userMail}`);

      } catch (error) {
        console.error('❌ Disconnect error:', error);
      }
    });

  });
};


// ---------- COMMON ----------

const publishMessage = async (io, message, topic) => {
  try {
    if (kafkaConfig.enabled) {
      const pushed = await produce(message, topic);
      if (pushed) return;
    }

    await saveMessage(
      message.messageText,
      message.userMail,
      message.isEvent,
      message.roomName
    );

    io.to(message.roomName).emit('receiveMessage', message);

  } catch (err) {
    console.error("❌ publishMessage error:", err);
  }
};

const prepareMessage = (roomName, messageText, userMail, isEvent) => ({
  roomName,
  messageText,
  userMail,
  isEvent,
});

module.exports = socketHandler;