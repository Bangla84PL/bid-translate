export * from "./database";

/**
 * Application-specific types
 */

export interface CreateAuctionData {
  languagePair: { source: string; target: string };
  specialization?: string;
  isSworn: boolean;
  wordCount: number;
  deadline: Date;
  startingPrice: number;
  description: string;
  fileUrl?: string;
  participantIds: string[];
}

export interface AuctionFilters {
  languagePair?: { source: string; target: string };
  specialization?: string;
  isSworn?: boolean;
}

export interface TranslatorImportRow {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  languagePairs: string; // Comma-separated: "EN-PL,PL-EN"
  specializations?: string; // Comma-separated: "medical,legal"
  isSworn?: boolean;
}

export interface SubscriptionLimits {
  maxAuctionsPerMonth: number;
  maxTranslators: number;
  auctionsUsed: number;
  translatorsCount: number;
  canCreateAuction: boolean;
  canAddTranslator: boolean;
}

export interface AuctionRoundUpdate {
  auctionId: string;
  round: number;
  price: number;
  participantsRemaining: number;
  timeRemaining: number;
}

export interface DashboardStats {
  activeAuctions: number;
  completedThisMonth: number;
  averageSavings: number;
  successRate: number;
  auctionsUsedThisMonth: number;
  auctionsLimitThisMonth: number;
}
