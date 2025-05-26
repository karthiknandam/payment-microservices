import env from "dotenv";
import { NextFunction, Request, Response } from "express";
import { AuthResponse } from "../utils/types";
import jwt, { JwtPayload } from "jsonwebtoken";
import logger from "../utils/logger";
env.config();
interface AuthRequest extends Request {
  user?: {
    id: string;
  };
  cookies: {
    token: string;
  };
}
export const AuthMiddlware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info("User Middleware hit ..");
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(403).json({
        success: false,
        message: "Forbidden request",
        error: "Unauthorized user / Please signup",
      } satisfies AuthResponse);
      return;
    }
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET not found");
    }
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!decoded.id) {
      throw new Error("User id not found");
    }

    req.user = { id: decoded.id };
    next();
  } catch (error) {
    logger.warn("Internal server Error", error);
    res.status(500).json({
      success: false,
      message: "Unauthorized : Invalid token",
      error: error,
    } satisfies AuthResponse);
  }
};
