const {Kafka} = require('kafkajs');
const { kafkaConfig } = require('../../config');

let producer = null;
if (kafkaConfig.enabled) {
  const kafkaConfigObj = {
    clientId: 'my-app',
    brokers: kafkaConfig.brokers
  };

  if (kafkaConfig.ssl) {
    kafkaConfigObj.ssl = kafkaConfig.ssl;
  }

  const kafka = new Kafka(kafkaConfigObj);
  producer = kafka.producer();
}

const produce = async (res,  topic) => {
    if (!producer) {
      return false;
    }
    await producer.connect();
    await producer.send({
        topic,
        //convert value to a JSON string and send it
        messages: [{
            value: JSON.stringify(res) }]
    });
    console.log('Message sent successfully', res)

    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);
    return true;
}

async function handleShutdown(signal) {
    console.log(`Received signal ${signal}, shutting down Kafka producer...`);
    if (!producer) return;
    await producer.disconnect();
    console.log("Kafka producer disconnected");
    process.exit(0); // Exit the process after consumer disconnects
}

module.exports = {produce}
