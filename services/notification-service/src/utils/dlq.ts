import { producer } from "./kafka";
import logger from "./logger";

export async function sendToDLQ(event: string, error: string) {
  try {
    await producer.send({
      topic: "payment.event-dlq",
      messages: [
        {
          value: JSON.stringify({
            event,
            error,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });
    logger.info("Failed message sent to DLQ:", event);
  } catch (err) {
    logger.error("Error sending message to DLQ:", err);
  }
}
