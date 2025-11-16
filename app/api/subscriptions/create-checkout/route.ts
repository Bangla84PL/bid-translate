import { NextRequest, NextResponse } from "next/server";
import { getCurrentAgency, getCurrentUser } from "@/lib/supabase/auth";
import Stripe from "stripe";
import { STRIPE_PLANS, PlanType } from "@/lib/stripe/config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

/**
 * POST /api/subscriptions/create-checkout
 * Create a Stripe checkout session for subscription
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const agency = await getCurrentAgency();

    if (!user || !agency) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
    }

    const body = await request.json();
    const { planType } = body as { planType: PlanType };

    if (!STRIPE_PLANS[planType]) {
      return NextResponse.json({ error: "Nieprawidłowy plan" }, { status: 400 });
    }

    const plan = STRIPE_PLANS[planType];

    // Create or get Stripe customer
    let customerId = agency.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          agency_id: agency.id,
          company_name: agency.company_name,
        },
      });
      customerId = customer.id;

      // Update agency with customer ID
      // (would need to call Supabase update here)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: plan.interval ? "subscription" : "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            product_data: {
              name: `BidTranslate ${plan.name}`,
              description: plan.interval
                ? `${plan.maxAuctions} aukcji/miesiąc, ${plan.maxTranslators} tłumaczy`
                : "Nielimitowane aukcje i tłumacze - dożywotni dostęp",
            },
            unit_amount: plan.price * 100, // Convert to cents
            ...(plan.interval && { recurring: { interval: plan.interval } }),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?payment=cancelled`,
      metadata: {
        agency_id: agency.id,
        plan_type: planType,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Błąd podczas tworzenia sesji płatności" },
      { status: 500 }
    );
  }
}
