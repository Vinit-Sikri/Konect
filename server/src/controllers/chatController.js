// src/controllers/chatController.js
const { saveMessage, getRecentMessages } = require('../../utils/redisUtils');
const sequelize = require('../database/connection');
const ChatRoom = require('../models/ChatRoom');
const {getMessage, getRoomName} = require('../repos/chatRoom')
const Message = require('../models/Message');
const createChatRoom = async (req, res) => {
  try {
    const { name } = req.body;
    const chatRoom = await ChatRoom.create({ name });
    res.json(chatRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const listChatRooms = async (req, res) => {
  try {
    const chatRooms = await ChatRoom.findAll();
    res.json(chatRooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getChatMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const roomName = await getRoomName(id)
    const messages = await getMessage(roomName)
    console.log(`--------- retrived messages roomName : ${roomName},  Message lenght : ${messages.length}------\n`)
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const deleteChatRoom = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the room first to get its name
    const room = await ChatRoom.findByPk(id);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // 2. Delete all messages associated with this room name
    // (Important because your Message model links via room_name)
    await Message.destroy({
      where: { room_name: room.name }
    });

    // 3. Delete the room
    await room.destroy();

    res.json({ message: 'Room and chat history deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
module.exports = { createChatRoom, listChatRooms, getChatMessages, deleteChatRoom };
