import express from "express";
import { UserController } from "../controller/user.controller";

const router = express.Router();

router.post("/signup", UserController.Signup);
router.post("/signin", UserController.Signin);

export default router;
