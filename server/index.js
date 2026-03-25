// index.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local'), override: true });
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const socketIO = require('socket.io');
const chatRoutes = require('./src/routes/chatRoutes');
const socketHandler = require('./src/handlers/socketHandler');
const { consume } = require('./src/kafka/consumer');
const { kafkaConfig } = require('./config');
const { startServer, handleShutdown } = require('./src/handlers/serverHandler');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.io
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// CORS middleware for REST API
app.use((req, res, next) => {
  const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ['*'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use('/api', chatRoutes);
app.get('/health', (_, res) => res.status(200).json({ status: 'ok' }));
// Static files served by Vercel in production
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static('../client'));
}

// Use the socketHandler
socketHandler(io);

// Initialize kafka consumer when configured
if (kafkaConfig.enabled) {
  consume(io).then(() => {
      console.log("------------Working consumer, waiting for server to start-----------")
  }).catch(err => {
      console.log("Occurred error ", err)
  });
} else {
  console.log("Kafka consumer disabled. Running in direct messaging mode.");
}

// Synchronize Sequelize models with the database
(async () => {
    const srv = await startServer(PORT, server);
    await handleShutdown(srv);
})();
