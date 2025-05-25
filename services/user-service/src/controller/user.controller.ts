import bcrypt from "bcrypt";
import { Request, Response } from "express";
import logger from "../utils/logger";
import {
  SignInSchema,
  SignUpSchema,
  SignUpType,
} from "../validation/auth.validation";
import prisma from "../lib/prisma";
import { string } from "zod";
import { generateToken } from "../utils/token";
interface AuthRequest extends Request {
  body: SignUpType;
}
interface AuthResponse {
  success: boolean;
  message: string;
  error: Error | string | unknown;
}
interface ResponseData {
  user_id: string;
  email: string;
}

export class UserController {
  private constructor() {}
  private static async generatePassword(password: string): Promise<string> {
    const a = await bcrypt.hash(password, 11);
    return a;
  }
  private static async comparePassword(
    password: string,
    encryptedPass: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, encryptedPass);
  }

  public static async Signup(req: AuthRequest, res: Response) {
    logger.info("Registering user info");
    try {
      const data = SignUpSchema.safeParse(req.body);
      if (!data.success) {
        //  to ensure we can make the errors better as possible
        const errMap = data.error.errors.reduce((acc, err) => {
          acc[err.path[0]] = err.message;
          return acc;
        }, {} as Record<string, string>);

        res.status(403).json({
          success: false,
          message: "Please enter correct details",
          error: errMap,
        } satisfies AuthResponse);
        return;
      }

      const { name, email, password, phone_number } = req.body;

      //   check user details exists or not
      const checkUser = await prisma.user.findFirst({
        where: {
          email,
          phone_number,
        },
      });

      if (checkUser) {
        res.status(400).json({
          success: false,
          message: "User already exists",
          error: "User details found please login",
        } satisfies AuthResponse);
        return;
      }

      //   hashing password <Because we are using single ton pattern we cannot use this binding here so we must use the class itself -> took me 20min to realize>
      const encryptedPassword = await UserController.generatePassword(password);
      //   create user

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: encryptedPassword,
          phone_number,
        },
        select: {
          id: true,
        },
      });

      res.status(200).json({
        success: true,
        message: "Succesfully created account",
        error: undefined,
        data: {
          user_id: user.id,
          email,
        },
      } satisfies AuthResponse & {
        data: ResponseData;
      });
    } catch (error) {
      logger.warn("Internal server Error", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      } satisfies AuthResponse);
    }
  }

  public static async Signin(
    req: Request<
      any,
      any,
      {
        email: string;
        password: string;
      }
    >,
    res: Response
  ) {
    logger.info("Signin user...");
    try {
      const data = SignInSchema.safeParse(req.body);
      if (!data.success) {
        //  to ensure we can make the errors better as possible
        const errMap = data.error.errors.reduce((acc, err) => {
          acc[err.path[0]] = err.message;
          return acc;
        }, {} as Record<string, string>);

        res.status(403).json({
          success: false,
          message: "Please enter correct details",
          error: errMap,
        } satisfies AuthResponse);
        return;
      }

      const { email, password } = req.body;
      // user exists ?
      const user = await prisma.user.findFirst({
        where: {
          email,
        },
        select: {
          id: true,
          password: true,
        },
      });

      if (!user) {
        res.status(400).json({
          success: false,
          message: "Wrong credentials",
          error: {
            email: "Cannot found details , Please signup",
          },
        } satisfies AuthResponse);
        return;
      }

      const checkPassword = await UserController.comparePassword(
        password,
        user.password
      );
      if (!checkPassword) {
        res.status(400).json({
          success: false,
          message: "Incorrect password",
          error: {
            password: "Incorrect password",
          },
        } satisfies AuthResponse);
        return;
      }

      const token = generateToken(user.id, email);

      res.status(200).json({
        success: false,
        message: "Login succesfully ✅",
        error: "",
        data: {
          user_id: user.id,
          email,
          token,
        },
      } satisfies AuthResponse & {
        data: ResponseData & {
          token: string;
        };
      });
    } catch (error) {
      logger.warn("Internal server Error", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      } satisfies AuthResponse);
    }
  }
}
