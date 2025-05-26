import express from "express";
import { PaymentController } from "../controller/payment.controller";
import { AuthMiddlware } from "../middleware/authMiddleware";

const router = express.Router();
router.use(AuthMiddlware);
router.post("/add", PaymentController.AddPaymentMethod);
router.get("/get", PaymentController.GetPaymentDetails);
export default router;
