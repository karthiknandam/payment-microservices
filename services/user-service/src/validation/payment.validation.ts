import z from "zod";

const PaymentSchema = z.object({
  card_number: z
    .string({ message: "Invalid cardNumber" })
    .nonempty({ message: "card number cannot be empty" })
    .regex(/^\d{13,19}$/, {
      message: "Card number must be 13-19 digits long.",
    }),
  expiry_date: z
    .string({ message: "Invalid expirydate" })
    .nonempty({ message: "Expirty date cannot be empty" })
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, {
      message: "Expirty Date must be in MM/YY format",
    }),
  cardholder_name: z
    .string({ message: "Invalid name" })
    .min(1, { message: "Card holder name must not be empty" })
    .max(100, {
      message: "Card holder name must be less than 100 letters",
    }),
});

type PaymentType = z.infer<typeof PaymentSchema>;

export { PaymentSchema, PaymentType };
