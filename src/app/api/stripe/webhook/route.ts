import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, tier } = session.metadata || {};

        if (userId && tier) {
          // Update user's subscription in database
          console.log(`Subscription created for user ${userId}: ${tier}`);
          // TODO: Update profile with:
          // - subscriptionTier: tier
          // - stripeCustomerId: session.customer
          // - stripeSubscriptionId: session.subscription
          // - subscriptionStatus: 'active'
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const { userId, tier } = subscription.metadata || {};

        if (userId) {
          console.log(`Subscription updated for user ${userId}: ${subscription.status}`);
          // TODO: Update profile with:
          // - subscriptionStatus: subscription.status
          // - subscriptionTier: tier (if changed)
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const { userId } = subscription.metadata || {};

        if (userId) {
          console.log(`Subscription canceled for user ${userId}`);
          // TODO: Update profile with:
          // - subscriptionTier: 'free'
          // - subscriptionStatus: 'canceled'
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment succeeded for invoice ${invoice.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment failed for invoice ${invoice.id}`);
        // TODO: Update profile subscriptionStatus to 'past_due'
        // TODO: Send email notification to user
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
