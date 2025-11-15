/**
 * Stripe configuration and pricing constants
 */

export const STRIPE_PLANS = {
  starter: {
    name: "Starter",
    price: 100,
    currency: "PLN",
    interval: "month" as const,
    maxAuctions: 25,
    maxTranslators: 100,
  },
  professional: {
    name: "Professional",
    price: 250,
    currency: "PLN",
    interval: "month" as const,
    maxAuctions: 100,
    maxTranslators: 1000,
  },
  unlimited: {
    name: "Unlimited",
    price: 1000,
    currency: "PLN",
    interval: "month" as const,
    maxAuctions: -1, // unlimited
    maxTranslators: -1,
  },
  lifetime: {
    name: "Lifetime",
    price: 10000,
    currency: "PLN",
    interval: null, // one-time payment
    maxAuctions: -1,
    maxTranslators: -1,
  },
} as const;

export type PlanType = keyof typeof STRIPE_PLANS;

/**
 * Get plan details by type
 */
export function getPlanDetails(planType: PlanType) {
  return STRIPE_PLANS[planType];
}

/**
 * Calculate prorated price for plan upgrade
 */
export function calculateProratedPrice(
  currentPlan: PlanType,
  newPlan: PlanType,
  daysRemaining: number
): number {
  const currentPrice = STRIPE_PLANS[currentPlan].price;
  const newPrice = STRIPE_PLANS[newPlan].price;

  const daysInMonth = 30;
  const currentProratedValue = (currentPrice / daysInMonth) * daysRemaining;
  const newProratedValue = (newPrice / daysInMonth) * daysRemaining;

  return Math.max(0, newProratedValue - currentProratedValue);
}
