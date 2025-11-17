import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { STRIPE_PLANS, PlanType } from "@/lib/stripe/config";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not defined");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-10-29.clover",
  });
}

function getWebhookSecret() {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not defined");
  }
  return process.env.STRIPE_WEBHOOK_SECRET;
}

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const webhookSecret = getWebhookSecret();
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    const supabase = createServiceRoleClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const agencyId = session.metadata?.agency_id;
        const planType = session.metadata?.plan_type as PlanType;

        if (!agencyId || !planType) {
          console.error("Missing metadata in checkout session");
          break;
        }

        const plan = STRIPE_PLANS[planType];

        // Update agency subscription
        await supabase
          .from("bid_translate_agencies")
          .update({
            subscription_status: "active",
            plan_type: planType,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            max_auctions_per_month: plan.maxAuctions,
            max_translators: plan.maxTranslators,
            billing_anniversary: new Date().toISOString().split("T")[0],
          })
          .eq("id", agencyId);

        console.log(`Subscription activated for agency ${agencyId}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Reset monthly usage counter
        await supabase
          .from("bid_translate_agencies")
          .update({
            auctions_used_this_month: 0,
            subscription_status: "active",
          })
          .eq("stripe_customer_id", customerId);

        console.log(`Monthly usage reset for customer ${customerId}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Mark subscription as expired
        await supabase
          .from("bid_translate_agencies")
          .update({
            subscription_status: "expired",
          })
          .eq("stripe_customer_id", customerId);

        console.log(`Subscription cancelled for customer ${customerId}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Handle subscription updates (plan changes, etc.)
        console.log(`Subscription updated for customer ${customerId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
