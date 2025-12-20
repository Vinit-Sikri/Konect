// Kafka temporarily disabled in demo mode.
// Uncomment logic when Redpanda/Postgres are available.


import { Kafka, Producer, SASLOptions } from "kafkajs";
import db from "./prisma";

// ✅ Conditionally build SASL config for type safety
const getSaslConfig = (): SASLOptions | undefined => {
  const mechanism = (process.env.KAFKA_MECHANISM || "scram-sha-256").toLowerCase();

  if (process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD) {
    if (mechanism === "plain" || mechanism === "scram-sha-256" || mechanism === "scram-sha-512") {
      return {
        mechanism, // ✅ TS now infers correct literal type
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD,
      } as SASLOptions;
    }
  }

  return undefined;
};

const kafka = new Kafka({
  clientId: "chat-app",
  brokers: [process.env.KAFKA_BROKER!],
  ssl: true,
  sasl: getSaslConfig(),
});

let producer: Producer | null = null;

const createProducer = async () => {
  if (producer) return producer;

  const _producer = kafka.producer();
  await _producer.connect();
  producer = _producer;

  console.log("✅ Kafka producer connected to Redpanda Cloud");
  return producer;
};

const produceMessage = async (message: string) => {
  const producer = await createProducer();

  await producer.send({
    topic: process.env.KAFKA_TOPIC || "MESSAGES",
    messages: [{ key: `message-${Date.now()}`, value: message }],
  });

  console.log("📤 Message produced to Kafka:", message);
  return true;
};

const consumeMessage = async () => {
  const consumer = kafka.consumer({ groupId: "default" });

  await consumer.connect();
  await consumer.subscribe({
    topic: process.env.KAFKA_TOPIC || "MESSAGES",
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ message, pause }) => {
      if (!message.value) return;

      console.log("📥 Kafka message consumed:", message.value.toString());
      try {
        await db.message.create({
          data: {
            message: message.value.toString(),
            username: "",
          },
        });
      } catch (error) {
        console.error("❌ Database write error:", error);
        pause();
        setTimeout(() => {
          consumer.resume([{ topic: process.env.KAFKA_TOPIC || "MESSAGES" }]);
        }, 60 * 1000);
      }
    },
  });
};

export { kafka, createProducer, produceMessage, consumeMessage }