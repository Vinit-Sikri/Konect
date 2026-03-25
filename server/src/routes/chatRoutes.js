// src/routes/chatRoutes.js
const express = require('express');
const { register, login } = require('../controllers/authController');
const { createChatRoom, listChatRooms, getChatMessages, deleteChatRoom } = require('../controllers/chatController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.post('/chat', authenticate, createChatRoom);
router.get('/chat', authenticate, listChatRooms);
router.get('/chat/:id/messages', authenticate, getChatMessages);
router.delete('/chat/:id', authenticate, deleteChatRoom);

module.exports = router;

