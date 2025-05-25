import env from "dotenv";
env.config();
import jwt, { Jwt } from "jsonwebtoken";
const secret = process.env.JWT_SECRET;

const generateToken = (id: string, email: string): string => {
  if (!secret) {
    throw new Error("Cannot find JWT_SECRET");
  }
  return jwt.sign({ id, email }, secret, { expiresIn: "1h" });
};
export { generateToken };
