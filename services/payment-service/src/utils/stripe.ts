import env from "dotenv";
import Stripe from "stripe";
import logger from "./logger";
import { info } from "console";

env.config();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

export async function processPayment(
  orderId: string,
  userId: string,
  amount: number,
  item: string,
  cardNumber: string,
  expiry_date: string
) {
  try {
    const [expMonth, expYear] = expiry_date
      .split("/")
      .map((part) => parseInt(part, 10));
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        number: cardNumber, // for instance this is indian card test number "4000003560000008",
        exp_month: expMonth, //12
        exp_year: expYear, //2026,
        cvc: "123", // for now randomizing the cvv we shall pass it through the request handler
      },
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "inr",
      payment_method: paymentMethod.id,
      metadata: {
        orderId,
        userId,
        item,
      },
      description: `Order ${orderId} for user ${userId}`,
      confirm: true,
      return_url: "http://google.com", // frontend redirect url for  3DS redirect in real flows
    });
    return { success: true, paymentIntentId: paymentIntent.id };
  } catch (error: any) {
    console.error(`Payment failed for order ${orderId}:`, error.message);
    return { success: false, error: error.message };
  }
}
