import { Kafka, Producer } from "kafkajs";
import db from "./prisma";

const kafka = new Kafka({
  clientId: "chat-app",
  brokers: ["localhost:9092"], // Local Kafka
  ssl: false, // Disable SSL for local dev
});

let producer: null | Producer = null;

const createProducer = async () => {
  if (producer) return producer;

  const _producer = kafka.producer();
  await _producer.connect();
  producer = _producer;

  return producer;
};

const produceMessage = async (message: string) => {
  const producer = await createProducer();

  await producer.send({
    messages: [{ key: `message-${Date.now()}`, value: message }],
    topic: "MESSAGES",
  });

  return true;
};

const consumeMessage = async () => {
  const consumer = kafka.consumer({ groupId: "default" });

  await consumer.connect();
  await consumer.subscribe({ topic: "MESSAGES", fromBeginning: true });

  await consumer.run({
    autoCommit: true,
    eachMessage: async ({ message, pause }) => {
      if (!message.value) return;

      console.log("Kafka broker consumed message");
      try {
        await db.message.create({
          data: {
            message: message.value.toString(), // ✅ updated field name
            username: "", // or provide a real username if available
          },
        });
      } catch (error) {
        console.log("Database write error");
        pause();
        setTimeout(() => {
          consumer.resume([{ topic: "MESSAGES" }]);
        }, 60 * 1000);
      }
    },
  });
};

export { kafka, createProducer, produceMessage, consumeMessage };
