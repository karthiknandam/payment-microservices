import env from "dotenv";
import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger";
import { AuthResponse } from "../utils/types";
import jwt, { JwtPayload } from "jsonwebtoken";
env.config();
interface AuthRequest extends Request {
  user?: {
    id: string;
  };
  cookies: {
    token?: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET;

export const AuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  logger.info("Middleware fucntion hit");
  try {
    const token = req.cookies?.token;

    if (!token) {
      res.status(400).json({
        success: false,
        message: "Unauthorized user / Please signup",
        error: "Forbidden request",
      } satisfies AuthResponse);
      return;
    }

    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET not found");
    }

    const verify = jwt.verify(token, JWT_SECRET) as JwtPayload;

    const { id } = verify;

    if (!id) {
      throw new Error("Cannot find userId / Please login or signup");
    }
    req.user = { id };
    next();
  } catch (error) {
    logger.warn("Authentication error... : ", error);
    res.status(500).json({
      success: false,
      message: "Authentication error",
      error: error,
    } satisfies AuthResponse);
  }
};
