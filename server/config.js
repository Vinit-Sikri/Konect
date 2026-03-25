const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local"), override: true });
dotenv.config();

const resolveCertPath = (certPath) => {
  if (!certPath) return null;
  if (fs.existsSync(certPath)) return certPath;

  const localFallback = path.resolve(__dirname, "..", certPath.replace(/^\/+/, ""));
  if (fs.existsSync(localFallback)) return localFallback;

  return null;
};

const buildKafkaSsl = () => {
  if (process.env.KAFKA_SSL !== "true") return null;

  const caPath = resolveCertPath(process.env.KAFKA_CA_CERT);
  const certPath = resolveCertPath(process.env.KAFKA_ACCESS_CERT);
  const keyPath = resolveCertPath(process.env.KAFKA_ACCESS_KEY);

  if (!caPath || !certPath || !keyPath) {
    console.warn("Kafka SSL enabled but certificate files are missing. Kafka will be disabled.");
    return null;
  }

  return {
    rejectUnauthorized: true,
    ca: [fs.readFileSync(caPath, "utf-8")],
    cert: fs.readFileSync(certPath, "utf-8"),
    key: fs.readFileSync(keyPath, "utf-8"),
  };
};

// ✅ Kafka config
const brokers = process.env.KAFKA_BROKERS
  ? process.env.KAFKA_BROKERS.split(",").map((b) => b.trim()).filter(Boolean)
  : [];

const kafkaSsl = buildKafkaSsl();
const kafkaNeedsSsl = process.env.KAFKA_SSL === "true";

// ✅ Redis TLS check
const isSecureRedis = (process.env.REDIS_URL || "").startsWith("rediss://");

module.exports = {

  // ✅ DATABASE FIX (supports DATABASE_URL)
  database: process.env.DATABASE_URL
    ? {
        url: process.env.DATABASE_URL,
        dialect: "postgres",
      }
    : {
        username: process.env.DB_USER || "user",
        password: process.env.DB_PASSWORD || "1234",
        database: process.env.DB_NAME || "chat-app",
        host: process.env.DB_HOST || "localhost",
        dialect: "postgres",
        port: process.env.DB_PORT || 5432,
      },

  jwt_expiry: process.env.JWT_EXPIRY || "6h",
  jwt_secret: process.env.JWT_SECRET || "a_strong_secret_key",

  // ✅ REDIS FIX (TLS support added)
  redisConfig: {
    url: process.env.REDIS_URL || "redis://redis-container:6379",
    enabled: (process.env.REDIS_ENABLED || "true") === "true",
    socket: isSecureRedis
      ? {
          tls: true,
          rejectUnauthorized: false,
        }
      : undefined,
  },

  kafkaConfig: {
    enabled:
      (process.env.KAFKA_ENABLED || "true") === "true" &&
      brokers.length > 0 &&
      (!kafkaNeedsSsl || Boolean(kafkaSsl)),

    brokers,
    ssl: kafkaSsl,

    topic: {
      CHAT_MESSAGES: "chat-messages",
      CHAT_EVENTS: "chat-events",
    },
  },
};