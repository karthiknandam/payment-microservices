import express from "express";
import { OrderController } from "../controller/order.controller";
import { AuthMiddleware } from "../middleware/authMiddleware";

const router = express.Router();
router.use(AuthMiddleware);
router.post("/create", OrderController.CreateOrder);
router.get("/:orderId", OrderController.GetOrderStatus);

export default router;
