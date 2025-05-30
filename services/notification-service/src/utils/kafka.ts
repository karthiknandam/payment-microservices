import { Kafka, Partitioners } from "kafkajs";

const kafka = new Kafka({
  clientId: "notification-service",
  brokers: ["localhost:9092"],
  retry: {
    initialRetryTime: 100,
    maxRetryTime: 3000,
    retries: 5,
    factor: 0.2,
  },
});

const producer = kafka.producer({
  createPartitioner: Partitioners.DefaultPartitioner,
});

const consumer = kafka.consumer({
  groupId: "notification-service-group",
});

process.on("SIGINT", async () => {
  await consumer.disconnect();
  console.log("Kafka producer disconnected");
  process.exit();
});
