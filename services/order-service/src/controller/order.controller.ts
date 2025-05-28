import { Request, Response } from "express";
import logger from "../utils/logger";
import { OrderSchema, OrderType } from "../validations/order.validation";
import prisma from "../lib/prisma";
import { AuthRequest, AuthResponse } from "../utils/types";
import { Status } from "../generated/prisma";

export class OrderController {
  private constructor() {}

  public static async CreateOrder(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    logger.info("Creating order....");

    // schema validation
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

      const data = OrderSchema.safeParse(req.body);

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
      //   create order

      const { item, amount } = data.data;

      const order = await prisma.order.create({
        data: {
          user_id,
          item,
          amount,
          status: "Pending",
        },
      });

      //   Publish event to payment service to get order done
      // Kafka event

      res.status(200).json({
        success: true,
        message: "Order placed succesfully",
        error: undefined,
      } satisfies AuthResponse);
    } catch (error) {
      logger.warn("Internal server error : ", error);
      res.status(500).json({
        success: false,
        message: "Failed to create order.",
        error: error instanceof Error ? error.message : "Unknown error",
      } satisfies AuthResponse);
    }
  }

  public static async GetOrderStatus(req: AuthRequest, res: Response) {
    logger.info("Getting order status");

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

      const { orderId } = req.params;

      if (!orderId) {
        res.status(303).json({
          success: false,
          message: "OrderId is required",
          error: "OrderId is required",
        } satisfies AuthResponse);
        return;
      }

      const order = await prisma.order.findUnique({
        where: {
          user_id,
          id: orderId,
        },
        select: {
          status: true,
        },
      });

      if (!order) {
        res.status(403).json({
          success: false,
          message: "Order not found",
          error: "Order not found",
        } satisfies AuthResponse);
      }

      res.status(200).json({
        success: true,
        message: "Order fetched ✅",
        data: {
          orderId,
          status: order?.status,
        },
        error: undefined,
      } satisfies AuthResponse & {
        data: {
          orderId: string;
          status: Status | undefined;
        };
      });
    } catch (error) {
      logger.warn("Failed to fetch order status");
      res.status(500).json({
        success: false,
        message: "Failed to fetch order status",
        error: error instanceof Error ? error.message : "Unkown error",
      } satisfies AuthResponse);
    }
  }
}
