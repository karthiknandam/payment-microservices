import env from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import type { Request, Response } from "express";
import logger from "./utils/logger";

env.config();

const PORT = process.env.PORT || 3000;

const server = express();

server.use(cors());
server.use(helmet());
server.use(express.json());

server.get("/health", (req: Request, res: Response) => {
  logger.info("Running succesfully");
  res.status(200).json({
    message: "Running...",
  });
});

const startServer = async () => {
  try {
    server.listen(PORT, () => {
      logger.info(`API_GATEWAY server is running in port ${PORT}`);
    });
  } catch (error) {
    logger.warn(`Internal server error : ${error}`);
  }
};

startServer();
