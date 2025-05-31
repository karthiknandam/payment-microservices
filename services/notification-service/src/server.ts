import env from "dotenv";
import express, { Request, Response } from "express";
import { runConsumer } from "./utils/kafka";

env.config();
const PORT = process.env.PORT || 3006;
const server = express();

runConsumer();

server.get("/", (req: Request, res: Response) => {
  res.json({ success: true, message: "Notifiction servie is running....." });
});

server.listen();
