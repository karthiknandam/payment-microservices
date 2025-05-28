import { Request } from "express";

export interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}
export interface AuthResponse {
  success: boolean;
  message: string;
  error: Error | string | unknown;
}
