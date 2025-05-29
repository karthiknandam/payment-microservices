import { Kafka, KafkaJSAggregateError, Partitioners } from "kafkajs";
import prisma from "../lib/prisma";
import logger from "./logger";

const kafka = new Kafka({
  clientId: "order-service",
  brokers: ["localhost:29092"],
  retry: {
    initialRetryTime: 100,
    maxRetryTime: 30000,
    retries: 10,
    factor: 0.2,
  },
});

const producer = kafka.producer({
  createPartitioner: Partitioners.DefaultPartitioner,
});

let isProducerConnected: boolean = false;

export const publishEvent = async (message: string) => {
  if (!isProducerConnected) {
    await producer.connect();
    isProducerConnected = true;
  }

  await producer.send({
    topic: "order.create",
    messages: [{ key: `message-${Date.now()}`, value: message }],
  });
};

const consumer = kafka.consumer({
  groupId: "order-service-group",
});

export async function runConsumer() {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: "payment.event", fromBeginning: true });

    logger.info("Consumer is listening to payment.event");

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = message.value?.toString() as string;
        const data = JSON.parse(event);

        if (data.paymentStatus === "Paid" || data.paymentStatus === "Failed") {
          try {
            await prisma.order.update({
              where: {
                id: data.orderId,
              },
              data: {
                status: data.paymentStatus,
              },
            });
            logger.info("Status update");
          } catch (error) {
            logger.warn("Error updating order status:", error);
          }
        }
      },
    });
  } catch (error) {
    logger.warn("Error in Kafka consumer:", error);
  }
}

process.on("SIGINT", async () => {
  await producer.disconnect();
  await consumer.disconnect();
  logger.warn("Kafka producer disconnected");
  process.exit();
});
