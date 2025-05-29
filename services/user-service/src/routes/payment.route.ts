import express from "express";
import { PaymentController } from "../controller/payment.controller";
import { AuthMiddlware } from "../middleware/authMiddleware";

const router = express.Router();
router.post("/add", AuthMiddlware, PaymentController.AddPaymentMethod);
router.get("/get/:user_id", PaymentController.GetPaymentDetails);
export default router;
