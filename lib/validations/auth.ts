import { z } from "zod";

/**
 * Validation schemas for authentication forms
 */

export const registerSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
  confirmPassword: z.string(),
  companyName: z.string().min(2, "Nazwa firmy jest wymagana"),
  nip: z.string().regex(/^\d{10}$/, "NIP musi składać się z 10 cyfr"),
  address: z.string().min(5, "Adres jest wymagany"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła muszą być identyczne",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła muszą być identyczne",
  path: ["confirmPassword"],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
