import env from "dotenv";
import express, { Request, Response } from "express";
import logger from "./utils/logger";
import cors from "cors";
import helmet from "helmet";
import OrderRoute from "./routes/order.route";
import cookieParser from "cookie-parser";
env.config();

const server = express();
const PORT = process.env.PORT || 3002;
const API_GATEWAY = process.env.API_GATEWAY || "http://localhost:3000";

server.use(cookieParser());
server.use(express.json());
server.use(
  cors({
    origin: API_GATEWAY,
  })
);
server.use(helmet());
server.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
  });
});

server.use("/api/orders/", OrderRoute);

const startServer = async () => {
  logger.info("Starting Order service");
  try {
    server.listen(PORT, () => {
      console.log("server is listening in port : ", PORT);
    });
  } catch (error) {
    logger.warn("Internal server error");
  }
};

startServer();
