// routes/user.routes.ts
import express from "express";
import { UserController } from "../controller/user.controller";

const router = express.Router();

router.post("/signup", UserController.Signup);
router.post("/login", UserController.Signin);

export default router;
