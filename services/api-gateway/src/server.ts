import env from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import type { NextFunction, Request, Response } from "express";
import proxy from "express-http-proxy";
import logger from "./utils/logger";

env.config();

const PORT = process.env.PORT || 3000;
const USER_SERVICE = process.env.USER_SERVICE || "";
const server = express();

server.use(cors());
server.use(helmet());
server.use(express.json());

const proxyConfiguration = {
  proxyReqPathResolver: (req: Request) => {
    const newPath = req.originalUrl.replace(/^\/v1/, "/api");
    logger.debug(newPath);
    return newPath;
  },
  proxyErrorHandler: (err: Error, res: Response, next: NextFunction) => {
    if (err) {
      logger.warn(`Proxy error : ${err.message}`);
      res.status(500).json({
        message: "Internal server error",
        error: `Proxy Error : ${err.message}`,
      });
    }
  },
};

server.use(
  "/v1/auth",
  proxy(USER_SERVICE, {
    ...proxyConfiguration,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      // if (!proxyReqOpts.headers || Array.isArray(proxyReqOpts.headers)) {
      //   proxyReqOpts.headers = {};
      // }
      // To avoid read-only issue we use this method;
      (proxyReqOpts.headers as Record<string, string>)["Content-type"] =
        "application/json";
      return proxyReqOpts;
    },
    userResDecorator(proxyRes, proxyResData, userReq, userRes) {
      logger.info(
        `Response received from user service ${proxyRes.statusCode} `
      );
      return proxyResData;
    },
  })
);

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
