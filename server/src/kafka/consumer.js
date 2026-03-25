const { Kafka } = require('kafkajs');
const { kafkaConfig } = require('../../config');
const { saveMessage } = require("../repos/chatRoom");

let consumer = null;

if (kafkaConfig.enabled) {
  const kafkaConfigObj = {
    clientId: 'my-app',
    brokers: kafkaConfig.brokers
  };

  if (kafkaConfig.ssl) {
    kafkaConfigObj.ssl = kafkaConfig.ssl;
  }

  const kafka = new Kafka(kafkaConfigObj);
  consumer = kafka.consumer({ groupId: 'kafka' });
}

const consume = async (io) => {
  if (!consumer) {
    console.log("Kafka disabled, skipping consumer");
    return;
  }

  try {
    console.log("------------ Initializing Kafka Consumer -----------");

    await consumer.connect();
    await consumer.subscribe({ topic: kafkaConfig.topic.CHAT_MESSAGES, fromBeginning: true });
    await consumer.subscribe({ topic: kafkaConfig.topic.CHAT_EVENTS, fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const obj = JSON.parse(message.value);

          if (
            topic === kafkaConfig.topic.CHAT_MESSAGES ||
            topic === kafkaConfig.topic.CHAT_EVENTS
          ) {
            await saveMessage(obj.messageText, obj.userMail, obj.isEvent, obj.roomName);

            io.to(obj.roomName).emit('receiveMessage', obj);
          }
        } catch (err) {
          console.error("Kafka message error:", err);
        }
      },
    });

    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);

  } catch (err) {
    console.error("Kafka consumer failed:", err.message);
  }
};

async function handleShutdown() {
  if (!consumer) return;

  try {
    await consumer.disconnect();
    console.log("Kafka consumer disconnected");
  } catch (err) {
    console.error("Error disconnecting Kafka:", err);
  }
}

module.exports = { consume };