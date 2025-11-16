import { AuctionStatus } from "@/types/database";

/**
 * Auction state machine and business logic
 */

export const ROUND_DURATION = 60; // seconds
export const PRICE_REDUCTION_PERCENT = 5; // 5% per round
export const CONFIRMATION_WINDOW = 10 * 60; // 10 minutes in seconds
export const MIN_PARTICIPANTS = 3;

/**
 * Calculate the next round price (5% reduction)
 */
export function calculateNextPrice(currentPrice: number): number {
  const reduction = currentPrice * (PRICE_REDUCTION_PERCENT / 100);
  return Math.round((currentPrice - reduction) * 100) / 100;
}

/**
 * Check if auction can start
 */
export function canStartAuction(confirmedCount: number): boolean {
  return confirmedCount >= MIN_PARTICIPANTS;
}

/**
 * Determine next auction status based on current state
 */
export function getNextAuctionStatus(
  currentStatus: AuctionStatus,
  participantsRemaining: number
): AuctionStatus {
  switch (currentStatus) {
    case "draft":
      return "pending_start";
    case "pending_start":
      return participantsRemaining >= MIN_PARTICIPANTS ? "in_progress" : "failed";
    case "in_progress":
      return participantsRemaining === 1 ? "completed" : "in_progress";
    default:
      return currentStatus;
  }
}

/**
 * Check if participant should be eliminated for timeout
 */
export function shouldEliminateForTimeout(
  roundStartedAt: Date,
  now: Date = new Date()
): boolean {
  const elapsedSeconds = (now.getTime() - roundStartedAt.getTime()) / 1000;
  return elapsedSeconds >= ROUND_DURATION;
}

/**
 * Calculate time remaining in current round
 */
export function getTimeRemaining(roundStartedAt: Date, now: Date = new Date()): number {
  const elapsedSeconds = (now.getTime() - roundStartedAt.getTime()) / 1000;
  const remaining = ROUND_DURATION - elapsedSeconds;
  return Math.max(0, Math.round(remaining));
}

/**
 * Calculate auction statistics
 */
export function calculateAuctionStats(startingPrice: number, finalPrice: number | null) {
  if (!finalPrice) {
    return {
      savingsAmount: 0,
      savingsPercent: 0,
    };
  }

  const savingsAmount = startingPrice - finalPrice;
  const savingsPercent = (savingsAmount / startingPrice) * 100;

  return {
    savingsAmount: Math.round(savingsAmount * 100) / 100,
    savingsPercent: Math.round(savingsPercent * 10) / 10,
  };
}

/**
 * Validate auction can accept bid decisions
 */
export function canAcceptBid(auctionStatus: AuctionStatus): boolean {
  return auctionStatus === "in_progress";
}
