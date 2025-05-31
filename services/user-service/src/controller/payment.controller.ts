import { Request, Response } from "express";
import { AuthResponse } from "../utils/types";
import { PaymentSchema, PaymentType } from "../validation/payment.validation";
import logger from "../utils/logger";
import prisma from "../lib/prisma";

interface AuthRequest extends Request {
  // mensioning this is exists in the req methods ? by using this we can avoid ts errors
  user?: {
    id: string;
  };
}
type AuthResponsePaymentMethods = Omit<PaymentType, "expiry_date"> & {
  id: string;
  expiry_date: string;
};
export class PaymentController {
  private constructor() {}

  public static async AddPaymentMethod(req: AuthRequest, res: Response) {
    try {
      const user_id = req.user?.id;
      if (!user_id) {
        res.status(400).json({
          success: false,
          message: "Please login/signup user not found",
          error: "Anouthorize user",
        } satisfies AuthResponse);
        return;
      }
      const data = PaymentSchema.safeParse(req.body);
      if (!data.success) {
        const errMap = data.error.errors.reduce((acc, err) => {
          acc[err.path[0]] = err.message;
          return acc;
        }, {} as Record<string, string>);

        res.status(403).json({
          success: false,
          message: "Please enter correct details",
          error: errMap,
        } satisfies AuthResponse);
        return;
      }

      // find the payment method already exists;
      const { card_number, cardholder_name, expiry_date } =
        req.body as PaymentType;
      const isPaymentAlreadyExists = await prisma.paymentMethod.findFirst({
        where: {
          card_number,
          user_id,
        },
      });

      if (isPaymentAlreadyExists) {
        res.status(303).json({
          success: false,
          message: "Payment method alredy exists",
          error: "Add new payment",
        } satisfies AuthResponse);
        return;
      }

      await prisma.paymentMethod.create({
        data: {
          user_id,
          card_number,
          cardholder_name,
          expiry_date,
        },
      });

      res.status(200).json({
        success: true,
        message: "Payment method added ✅",
        error: "",
      } satisfies AuthResponse);
    } catch (error) {
      logger.warn("Internal server Error", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      } satisfies AuthResponse);
    }
  }

  public static async GetPaymentDetails(req: Request, res: Response) {
    logger.info("Getting paymentDetails.....");
    try {
      const { user_id } = req.params;
      if (!user_id) {
        res.status(400).json({
          success: false,
          message: "Please login/signup user not found",
          error: "Anouthorize user",
        } satisfies AuthResponse);
        return;
      }

      const userDetails = await prisma.user.findFirst({
        where: {
          id: user_id,
        },
        select: {
          email: true,
          payment_methods: {
            select: {
              id: true,
              cardholder_name: true,
              expiry_date: true,
              card_number: true,
            },
          },
        },
      });

      if (!userDetails) {
        res.status(403).json({
          success: false,
          message: "User not found",
          error: "Unauthorized user / Please signup or signin",
        } satisfies AuthResponse);
        return;
      }

      if (!userDetails?.payment_methods) {
        res.status(400).json({
          success: false,
          message: "No payment details found",
          error: "Add Payment Details to see",
        } satisfies AuthResponse);
        return;
      }

      res.status(200).json({
        success: false,
        message: "Fetched Data ✅",
        error: undefined,
        data: {
          // we can modify -> only for testing purposes
          email: userDetails.email,
          id: userDetails.payment_methods[0].id,
          cardholder_name: userDetails.payment_methods[0].cardholder_name,
          expiry_date: userDetails.payment_methods[0].expiry_date,
          card_number: userDetails.payment_methods[0].card_number,
        },
      } satisfies AuthResponse & {
        data: any;
      });
    } catch (error) {
      logger.warn(`Internal server error : ${error}`);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      } satisfies AuthResponse);
    }
  }
}
