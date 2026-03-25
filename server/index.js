const path = require('path');
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

const PORT = process.env.PORT || 3000;

// ✅ Clean CORS setup
const allowedOrigin = process.env.FRONTEND_URL || "*";

const io = socketIO(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(bodyParser.json());

// ✅ Clean REST CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", allowedOrigin);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Routes
app.use('/api', chatRoutes);

// Health check (IMPORTANT for Render)
app.get('/health', (_, res) => res.status(200).json({ status: 'ok' }));

// ❌ REMOVE static serving (frontend alag deploy hoga)
// if (process.env.NODE_ENV !== 'production') {
//   app.use(express.static('../client'));
// }

// Socket handler
socketHandler(io);

// ✅ Kafka only if explicitly enabled
if (process.env.KAFKA_ENABLED === "true") {
  consume(io)
    .then(() => console.log("Kafka consumer running"))
    .catch(err => console.log("Kafka error:", err));
} else {
  console.log("Kafka disabled");
}

// Start server
(async () => {
  const srv = await startServer(PORT, server);
  await handleShutdown(srv);
})();