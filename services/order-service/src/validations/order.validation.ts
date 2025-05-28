import z from "zod";

const OrderSchema = z.object({
  item: z
    .string({ message: "Invalid Item" })
    .min(1, { message: "Item cannot be empty" }),
  amount: z
    .number({ message: "Invalid amount format" })
    .min(0, { message: "Amount must be possitive number" }),
});

type OrderType = z.infer<typeof OrderSchema>;

export { OrderSchema, OrderType };
