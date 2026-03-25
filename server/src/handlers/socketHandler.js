const { getRecentMessages, setUserActive, setUserOffline, getOnlineUsers } = require('../../utils/redisUtils');
const { saveMessage } = require('../repos/chatRoom');
const { verifyToken } = require('../../utils/jwtUtils');
const { produce } = require('../kafka/producer');
const { kafkaConfig } = require('../../config');

const socketHandler = (io) => {

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) return next(new Error("Unauthorized"));

      const decoded = verifyToken(token);

      if (!decoded?.userMail) return next(new Error("Unauthorized"));

      socket.userMail = decoded.userMail;
      socket.userId = decoded.userId;

      next();
    } catch (error) {
      console.error("Socket auth error:", error.message);
      next(new Error("Unauthorized"));
    }
  });

  io.on('connection', (socket) => {
    const userMail = socket.userMail;
    console.log('User connected:', userMail);

    socket.on('joinRoom', async ({ roomName }) => {
      try {
        if (!roomName) return;

        socket.join(roomName);

        socket.emit('receiveMessage', {
          messageText: `Welcome ${userMail} to ${roomName}`,
          userMail: "system",
          isEvent: true,
          roomName
        });

        await setUserActive(socket.id, roomName, userMail);

        const newMessage = prepareMessage(
          roomName,
          `${userMail} joined the room`,
          userMail,
          true
        );

        await publishMessage(io, newMessage, kafkaConfig.topic.CHAT_EVENTS);

        const users = await getOnlineUsers(roomName);

        io.to(roomName).emit('onlineUsers', { roomName, users });

      } catch (err) {
        console.error("joinRoom error:", err);
      }
    });

    socket.on('sendMessage', async ({ roomName, message }) => {
      try {
        if (!roomName || !message) return;

        const newMessage = prepareMessage(roomName, message, userMail, false);

        await publishMessage(io, newMessage, kafkaConfig.topic.CHAT_MESSAGES);

      } catch (err) {
        console.error("sendMessage error:", err);
      }
    });

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

        io.to(roomName).emit('onlineUsers', { roomName, users });

      } catch (error) {
        console.error('disconnect error:', error);
      }
    });

  });
};

// helpers
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
    console.error("publishMessage error:", err);
  }
};

const prepareMessage = (roomName, messageText, userMail, isEvent) => ({
  roomName,
  messageText,
  userMail,
  isEvent,
});

module.exports = socketHandler;