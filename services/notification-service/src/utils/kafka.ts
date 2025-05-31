import env from "dotenv";
import { Kafka, Partitioners } from "kafkajs";
import { resend } from "./resend";
import { sendToDLQ } from "./dlq";
import logger from "./logger";

env.config();
const TEST_EMAIL = process.env.TEST_EMAIL || "thgearmonkey@gmail.com";
const kafka = new Kafka({
  clientId: "notification-service",
  brokers: ["localhost:29092"],
  retry: {
    initialRetryTime: 100,
    maxRetryTime: 3000,
    retries: 5,
    factor: 0.2,
  },
});

export const producer = kafka.producer({
  createPartitioner: Partitioners.DefaultPartitioner,
});

const consumer = kafka.consumer({
  groupId: "notification-service-group",
});

export async function runConsumer() {
  try {
    await producer.connect();
    await consumer.connect();

    await consumer.subscribe({ topic: "payment.event", fromBeginning: true });

    logger.info("Consumer and Producer is running");

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = JSON.parse(message.value?.toString() || "{}");
        // console.log(event);
        if (topic === "payment.event") {
          const userEmail = event.email;
          const paymentId = event.paymentIntentId;
          const paymentStatus = event.paymentStatus;
          try {
            if (paymentStatus === "Paid") {
              const { data, error } = await resend.emails.send({
                from: "Acme <onboarding@resend.dev>",
                to: TEST_EMAIL,
                // process.env.NODE_ENV === "production"
                //   ? userEmail
                //   : process.env.TEST_EMAIL,
                subject: "Payment Successful - Thank You!",
                html: `
                  <html>
                    <head>
                      <meta charset="UTF-8">
                      <title>Payment Successful Notification</title>
                      <style>
                        @media only screen and (max-width: 600px) {
                          .container {
                            width: 98% !important;
                            padding: 12px !important;
                          }
                          .main-content {
                            padding: 18px !important;
                          }
                          .cta-btn {
                            width: 100% !important;
                            font-size: 18px !important;
                          }
                        }
                      </style>
                    </head>
                    <body style="margin:0; padding:0; background:#f5faf6;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5faf6;">
                        <tr>
                          <td align="center">
                            <table class="container" width="480" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:14px; box-shadow:0 4px 24px #28a74520; margin:32px auto; padding:0 0 32px 0;">
                              <tr>
                                <td style="background:linear-gradient(90deg,#43e97b 0%,#38f9d7 100%); border-radius:14px 14px 0 0; padding:28px 0 16px 0; text-align:center;">
                                  <img src="https://img.icons8.com/fluency/48/000000/checked-checkbox.png" width="48" alt="Payment Success" style="display:block; margin:0 auto 8px auto;">
                                  <h1 style="color:#fff; font-family:Arial,sans-serif; font-size:2em; margin:0;">Payment Successful!</h1>
                                </td>
                              </tr>
                              <tr>
                                <td class="main-content" style="padding:28px 32px 0 32px; font-family:Arial,sans-serif; color:#333;">
                                  <p style="font-size:17px; margin:0 0 16px 0;">Dear Customer,</p>
                                  <p style="font-size:16px; margin:0 0 18px 0;">
                                    We are excited to inform you that your payment of <strong style="color:#43e97b;">$${event.amount}</strong> was successfully processed.
                                  </p>
                                  <table cellpadding="0" cellspacing="0" width="100%" style="background:#f0fdf6; border-radius:8px; margin:0 0 18px 0;">
                                    <tr>
                                      <td style="padding:16px;">
                                        <span style="font-size:15px; color:#43e97b; font-weight:bold;">Order Details:</span>
                                        <ul style="padding-left:18px; margin:10px 0 0 0; color:#222;">
                                          <li><strong>Order ID:</strong> #${event.orderId}</li>
                                          <li><strong>Item:</strong> ${event.item}</li>
                                        </ul>
                                        <div style="margin-top:10px; font-size:15px;">
                                          Transaction ID: <strong style="color:#38f9d7;">${paymentId}</strong>
                                        </div>
                                      </td>
                                    </tr>
                                  </table>
                                  <p style="font-size:16px; margin:0 0 18px 0;">
                                    If you have any questions or need further assistance, feel free to reach out to us.
                                  </p>
                                  <a href="mailto:support@example.com" class="cta-btn" style="display:inline-block; background:linear-gradient(90deg,#43e97b 0%,#38f9d7 100%); color:#fff; text-decoration:none; font-weight:bold; padding:12px 32px; border-radius:6px; font-size:16px; margin:10px 0 0 0; transition:background 0.3s;">Contact Support</a>
                                  <p style="color:#888; font-size:13px; margin:24px 0 0 0;">Thank you for choosing us!</p>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:20px 32px 0 32px; text-align:center;">
                                  <p style="font-size:12px; color:#bbb; margin:0;">
                                    &copy; 2025 Your Company Name. All rights reserved.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </body>
                  </html>
                `,
              });

              if (error) {
                logger.error(
                  `Error sending success email to ${userEmail}:`,
                  error
                );
              } else {
                logger.info(
                  `Success email sent to ${userEmail} regarding payment.`
                );
              }
            } else if (paymentStatus === "Failed") {
              const { data, error } = await resend.emails.send({
                from: "Acme <onboarding@resend.dev>",
                to: TEST_EMAIL,
                // process.env.NODE_ENV === "production"
                //   ? userEmail
                //   : process.env.TEST_EMAIL,
                subject: "Payment Failed - Action Required",
                html: `
                    <html>
                      <head>
                        <meta charset="UTF-8">
                        <title>Payment Failed Notification</title>
                        <style>
                          @media only screen and (max-width: 600px) {
                            .container {
                              width: 98% !important;
                              padding: 12px !important;
                            }
                            .main-content {
                              padding: 18px !important;
                            }
                            .cta-btn {
                              width: 100% !important;
                              font-size: 18px !important;
                            }
                          }
                        </style>
                      </head>
                      <body style="margin:0; padding:0; background:#f6f8fb;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fb;">
                          <tr>
                            <td align="center">
                              <table class="container" width="480" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:14px; box-shadow:0 4px 24px #e63c3c20; margin:32px auto; padding:0 0 32px 0;">
                                <tr>
                                  <td style="background:linear-gradient(90deg,#ff416c 0%,#ff4b2b 100%); border-radius:14px 14px 0 0; padding:28px 0 16px 0; text-align:center;">
                                    <img src="https://img.icons8.com/fluency/48/000000/high-risk.png" width="48" alt="Payment Failed" style="display:block; margin:0 auto 8px auto;">
                                    <h1 style="color:#fff; font-family:Arial,sans-serif; font-size:2em; margin:0;">Payment Failed</h1>
                                  </td>
                                </tr>
                                <tr>
                                  <td class="main-content" style="padding:28px 32px 0 32px; font-family:Arial,sans-serif; color:#333;">
                                    <p style="font-size:17px; margin:0 0 16px 0;">Dear Customer,</p>
                                    <p style="font-size:16px; margin:0 0 18px 0;">
                                      We regret to inform you that your payment of <strong style="color:#ff416c;">$${event.amount}</strong> could not be processed.
                                    </p>
                                    <table cellpadding="0" cellspacing="0" width="100%" style="background:#fff7f7; border-radius:8px; margin:0 0 18px 0;">
                                      <tr>
                                        <td style="padding:16px;">
                                          <span style="font-size:15px; color:#ff4b2b; font-weight:bold;">Order Details:</span>
                                          <ul style="padding-left:18px; margin:10px 0 0 0; color:#222;">
                                            <li><strong>Order ID:</strong> #${event.orderId}</li>
                                            <li><strong>Item:</strong> ${event.item}</li>
                                          </ul>
                                          <div style="margin-top:10px; font-size:15px;">
                                            Transaction ID: <strong style="color:#ff416c;">${paymentId}</strong>
                                          </div>
                                        </td>
                                      </tr>
                                    </table>
                                    <p style="font-size:16px; margin:0 0 18px 0;">
                                      Please check your payment method or contact our support team if you need assistance in resolving this issue.
                                    </p>
                                    <a href="mailto:support@example.com" class="cta-btn" style="display:inline-block; background:linear-gradient(90deg,#ff416c 0%,#ff4b2b 100%); color:#fff; text-decoration:none; font-weight:bold; padding:12px 32px; border-radius:6px; font-size:16px; margin:10px 0 0 0; transition:background 0.3s;">Contact Support</a>
                                    <p style="color:#888; font-size:13px; margin:24px 0 0 0;">We apologize for the inconvenience and appreciate your understanding.</p>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding:20px 32px 0 32px; text-align:center;">
                                    <p style="font-size:12px; color:#bbb; margin:0;">
                                      &copy; 2025 Your Company Name. All rights reserved.
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </body>
                  </html>

                `,
              });

              if (error) {
                logger.error(
                  `Error sending failure email to ${userEmail}:`,
                  error
                );
              } else {
                logger.info(
                  `Failure email sent to ${userEmail} regarding payment.`
                );
              }
            }
          } catch (error: any) {
            logger.error(`Error sending email to ${userEmail}:`, error.message);
            sendToDLQ(event, error.message);
          }
        }
      },
    });
  } catch (error) {
    logger.error("Error in Kafka consumer:", error);
  }
}

process.on("SIGINT", async () => {
  await consumer.disconnect();
  logger.info("Kafka producer disconnected");
  process.exit();
});
