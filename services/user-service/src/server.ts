import env from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import logger from "./utils/logger";
import router from "./routes/user.route";

env.config();
const PORT = process.env.PORT || 3001;
const API_GATEWAY = process.env.API_GATEWAY || "";
const server = express();

logger.info(API_GATEWAY);
server.use(express.json());
server.use(helmet());
server.use(
  cors({
    origin: API_GATEWAY,
  })
);

server.use("/api/auth/health", (req: Request, res: Response) => {
  try {
    logger.info("Running fine ....");
    res.status(200).json({
      message: "Running fine...",
      error: "",
    });
  } catch (error) {
    logger.warn(`Internal server error : ${error}`);
    res.status(500).json({
      message: `Internal server error`,
      error: error,
    });
  }
});

server.use("/api/auth/", router);

const startServer = async () => {
  try {
    server.listen(PORT, () => {
      logger.info(`USER_SERVICE running in : ${PORT}`);
    });
  } catch (error) {
    logger.warn(`Internal server Error : ${error}`);
  }
};

startServer();
