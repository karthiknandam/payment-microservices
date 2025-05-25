import { PrismaClient } from "../generated/prisma/client";
import logger from "../utils/logger";

const prismaClientSingleton = () => {
  logger.debug("Process is running for the prisma");
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
