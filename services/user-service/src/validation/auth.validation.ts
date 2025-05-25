import z from "zod";

const SignUpSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .nonempty({ message: "Name cannot be empty" })
    .min(3, { message: "At least 3 letters required" }),

  email: z
    .string({ required_error: "Email is required" })
    .nonempty({ message: "Email cannot be empty" })
    .email({ message: "Invalid email format" }),

  password: z
    .string({ required_error: "Password is required" })
    .nonempty({ message: "Password cannot be empty" })
    .min(6, { message: "Password should be at least 6 characters" }),

  phone_number: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits" })
    .regex(/^\+?[1-9]\d{1,14}$/, { message: "Invalid phone format" })
    .optional(),

  // provider: z.enum(["Google", "Github", "Provider"]).default("Provider"),
  // avater: z.string().optional(),
});

const SignInSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .nonempty({ message: "Email cannot be empty" })
    .email({ message: "Invalid email format" }),

  password: z
    .string({ required_error: "Password is required" })
    .nonempty({ message: "Password cannot be empty" })
    .min(6, { message: "Password should be at least 6 characters" }),
});

type SignUpType = z.infer<typeof SignUpSchema>;
type SignInType = z.infer<typeof SignInSchema>;

export { SignInSchema, SignUpSchema, SignInType, SignUpType };
