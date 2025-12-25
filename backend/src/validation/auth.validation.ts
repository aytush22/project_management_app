import { z } from "zod";

export const emailSchema = z.email("Invalid email address.").min(2).max(255);

export const passwordSchema = z.string().trim().min(8).max(25);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(255),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
