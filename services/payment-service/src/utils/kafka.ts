import axios from "axios";
import { Kafka, Partitioners } from "kafkajs";
import { processPayment } from "../utils/stripe";
import logger from "./logger";

const kafka = new Kafka({
  clientId: "payment-service",
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
let isProducerConnected = false;

export async function publishEvent(
  orderId: string,
  user_id: string,
  email: string,
  amount: number,
  item: string,
  paymentStatus: string,
  paymentIntentId: string
) {
  if (!isProducerConnected) {
    await producer.connect();
    isProducerConnected = true;
  }

  const messageData = {
    orderId,
    user_id,
    email,
    amount,
    item,
    paymentStatus,
    paymentIntentId,
  };

  await producer.send({
    topic: "payment.event",
    messages: [
      { key: `message-${Date.now()}`, value: JSON.stringify(messageData) },
    ],
  });
}

const consumer = kafka.consumer({
  groupId: "payment-service-group",
});

export async function runConsumer() {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: "order.create", fromBeginning: true });
    console.log("Consumer is listening to order.create");

    // Process messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const orderData = JSON.parse(message.value?.toString() || "{}");
        const { orderId, user_id, amount, item } = orderData;

        if (!orderId || !user_id || !amount) {
          logger.warn("Invalid order data:", orderData);
          return;
        }

        const apiGatewayUrl =
          process.env.API_GATEWAY_URL || "http://localhost:3000";

        const getUserPaymentDetails = await axios.get(
          `${apiGatewayUrl}/v1/auth/payment-methods/get/${user_id}`
        );
        const userEmail = getUserPaymentDetails.data.email;

        const card_number = getUserPaymentDetails.data.card_number;
        const expiry_date = getUserPaymentDetails.data.expiry_date;
        logger.info(userEmail);
        logger.info(card_number);
        logger.info(expiry_date);
        const result = await processPayment(
          orderId,
          user_id,
          amount,
          item,
          card_number,
          expiry_date
        );
        logger.info(`Payment result for order ${orderId}:`, result);

        if (result.success) {
          const paymentIntentId = result.paymentIntentId!;
          const paymentStatus = "Paid";

          publishEvent(
            orderId,
            user_id,
            userEmail,
            amount,
            item,
            paymentStatus,
            paymentIntentId
          );
        } else {
          const paymentIntentId = result.paymentIntentId || "N/A";
          const paymentStatus = "Failed";
          publishEvent(
            orderId,
            user_id,
            userEmail,
            amount,
            item,
            paymentStatus,
            paymentIntentId
          );
        }
      },
    });
  } catch (error) {
    logger.warn("Error in Kafka consumer:", error);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  await producer.disconnect();
  await consumer.disconnect();
  logger.warn("Kafka producer disconnected");
  process.exit();
});
