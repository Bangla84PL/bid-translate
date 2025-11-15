import { z } from "zod";

/**
 * Validation schemas for auction creation and management
 */

export const auctionSchema = z.object({
  languagePair: z.object({
    source: z.string().min(2, "Język źródłowy jest wymagany"),
    target: z.string().min(2, "Język docelowy jest wymagany"),
  }),
  specialization: z.string().optional(),
  isSworn: z.boolean().default(false),
  wordCount: z.number().min(1, "Liczba słów musi być większa niż 0"),
  deadline: z.string().min(1, "Termin jest wymagany"),
  startingPrice: z.number().min(0.01, "Cena początkowa musi być większa niż 0"),
  description: z.string().min(10, "Opis musi mieć minimum 10 znaków"),
  fileUrl: z.string().optional(),
  participantIds: z.array(z.string()).min(3, "Wybierz minimum 3 tłumaczy").max(10, "Możesz wybrać maksymalnie 10 tłumaczy"),
});

export type AuctionFormData = z.infer<typeof auctionSchema>;
