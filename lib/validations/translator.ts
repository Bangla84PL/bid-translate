import { z } from "zod";

/**
 * Validation schemas for translator management
 */

export const languagePairSchema = z.object({
  source: z.string().min(2, "Język źródłowy jest wymagany"),
  target: z.string().min(2, "Język docelowy jest wymagany"),
});

export const translatorSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  firstName: z.string().min(2, "Imię jest wymagane"),
  lastName: z.string().min(2, "Nazwisko jest wymagane"),
  phone: z.string().optional(),
  languagePairs: z.array(languagePairSchema).min(1, "Dodaj minimum jedną parę językową"),
  specializations: z.array(z.string()).default([]),
  isSworn: z.boolean().default(false),
  gdprConsent: z.boolean().refine((val) => val === true, {
    message: "Zgoda GDPR jest wymagana",
  }),
});

export type TranslatorFormData = z.infer<typeof translatorSchema>;
export type LanguagePair = z.infer<typeof languagePairSchema>;

// CSV Import validation
export const translatorCsvRowSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
  languagePairs: z.string(), // e.g., "EN-PL,PL-EN"
  specializations: z.string().optional(), // e.g., "medical,legal"
  isSworn: z.string().optional(), // "true" or "false"
});
