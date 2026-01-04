/**
 * Stripe Setup Script
 *
 * This script creates the necessary products and prices in your Stripe account.
 *
 * Usage:
 * 1. Get your Stripe Secret Key from: https://dashboard.stripe.com/apikeys
 * 2. Run: node scripts/setup-stripe.js YOUR_STRIPE_SECRET_KEY
 */

const Stripe = require('stripe');

async function setupStripe(secretKey) {
  if (!secretKey || !secretKey.startsWith('sk_')) {
    console.error('\n❌ Invalid Stripe secret key!');
    console.log('\nUsage: node scripts/setup-stripe.js sk_test_...\n');
    console.log('Get your key from: https://dashboard.stripe.com/apikeys');
    process.exit(1);
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' });

  console.log('\n🔧 Setting up Stripe for Goal Achiever Pro...\n');

  try {
    // Check if products already exist
    const existingProducts = await stripe.products.list({ limit: 100 });
    const existingPro = existingProducts.data.find(p => p.name === 'Goal Achiever Pro - Pro Plan');
    const existingPremium = existingProducts.data.find(p => p.name === 'Goal Achiever Pro - Premium Plan');

    let proProduct, premiumProduct;

    // Create Pro Product
    if (existingPro) {
      console.log('✓ Pro product already exists');
      proProduct = existingPro;
    } else {
      proProduct = await stripe.products.create({
        name: 'Goal Achiever Pro - Pro Plan',
        description: 'For serious goal achievers. Includes 12 Power Goals, unlimited MINS, advanced DRIP analysis, and more.',
        metadata: { tier: 'pro' },
      });
      console.log('✓ Created Pro product');
    }

    // Create Premium Product
    if (existingPremium) {
      console.log('✓ Premium product already exists');
      premiumProduct = existingPremium;
    } else {
      premiumProduct = await stripe.products.create({
        name: 'Goal Achiever Pro - Premium Plan',
        description: 'Maximum productivity & accountability. Includes everything in Pro plus AI insights, accountability matching, and weekly strategy calls.',
        metadata: { tier: 'premium' },
      });
      console.log('✓ Created Premium product');
    }

    // Get existing prices
    const existingPrices = await stripe.prices.list({ limit: 100, active: true });

    const findPrice = (productId, interval, amount) => {
      return existingPrices.data.find(
        p => p.product === productId &&
             p.recurring?.interval === interval &&
             p.unit_amount === amount
      );
    };

    // Create prices
    const prices = {};

    // Pro Monthly - $12/month
    const proMonthly = findPrice(proProduct.id, 'month', 1200);
    if (proMonthly) {
      prices.proMonthly = proMonthly.id;
      console.log('✓ Pro monthly price already exists');
    } else {
      const price = await stripe.prices.create({
        product: proProduct.id,
        unit_amount: 1200, // $12.00
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: { tier: 'pro', interval: 'monthly' },
      });
      prices.proMonthly = price.id;
      console.log('✓ Created Pro monthly price ($12/month)');
    }

    // Pro Yearly - $99/year (save 30%)
    const proYearly = findPrice(proProduct.id, 'year', 9900);
    if (proYearly) {
      prices.proYearly = proYearly.id;
      console.log('✓ Pro yearly price already exists');
    } else {
      const price = await stripe.prices.create({
        product: proProduct.id,
        unit_amount: 9900, // $99.00
        currency: 'usd',
        recurring: { interval: 'year' },
        metadata: { tier: 'pro', interval: 'yearly' },
      });
      prices.proYearly = price.id;
      console.log('✓ Created Pro yearly price ($99/year)');
    }

    // Premium Monthly - $29/month
    const premiumMonthly = findPrice(premiumProduct.id, 'month', 2900);
    if (premiumMonthly) {
      prices.premiumMonthly = premiumMonthly.id;
      console.log('✓ Premium monthly price already exists');
    } else {
      const price = await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 2900, // $29.00
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: { tier: 'premium', interval: 'monthly' },
      });
      prices.premiumMonthly = price.id;
      console.log('✓ Created Premium monthly price ($29/month)');
    }

    // Premium Yearly - $249/year (save 30%)
    const premiumYearly = findPrice(premiumProduct.id, 'year', 24900);
    if (premiumYearly) {
      prices.premiumYearly = premiumYearly.id;
      console.log('✓ Premium yearly price already exists');
    } else {
      const price = await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 24900, // $249.00
        currency: 'usd',
        recurring: { interval: 'year' },
        metadata: { tier: 'premium', interval: 'yearly' },
      });
      prices.premiumYearly = price.id;
      console.log('✓ Created Premium yearly price ($249/year)');
    }

    // Configure Customer Portal
    console.log('\n🔧 Configuring Customer Portal...');
    try {
      await stripe.billingPortal.configurations.create({
        business_profile: {
          headline: 'Manage your Goal Achiever Pro subscription',
        },
        features: {
          subscription_cancel: { enabled: true, mode: 'at_period_end' },
          subscription_update: {
            enabled: true,
            default_allowed_updates: ['price'],
            products: [
              { product: proProduct.id, prices: [prices.proMonthly, prices.proYearly] },
              { product: premiumProduct.id, prices: [prices.premiumMonthly, prices.premiumYearly] },
            ],
          },
          payment_method_update: { enabled: true },
          invoice_history: { enabled: true },
        },
        default_return_url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000/settings',
      });
      console.log('✓ Customer portal configured');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✓ Customer portal already configured');
      } else {
        console.log('⚠ Could not configure portal (you can set this up manually in Stripe Dashboard)');
      }
    }

    // Get publishable key info
    const publishableKey = secretKey.replace('sk_test_', 'pk_test_').replace('sk_live_', 'pk_live_');
    const isTestMode = secretKey.startsWith('sk_test_');

    // Output configuration
    console.log('\n' + '='.repeat(60));
    console.log('✅ STRIPE SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\nMode: ${isTestMode ? '🧪 TEST MODE' : '🔴 LIVE MODE'}`);
    console.log('\n📋 Add these to your .env.local file:\n');
    console.log('# Stripe');
    console.log(`STRIPE_SECRET_KEY=${secretKey}`);
    console.log(`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${publishableKey.slice(0, 20)}... (get from dashboard)`);
    console.log(`STRIPE_PRO_MONTHLY_PRICE_ID=${prices.proMonthly}`);
    console.log(`STRIPE_PRO_YEARLY_PRICE_ID=${prices.proYearly}`);
    console.log(`STRIPE_PREMIUM_MONTHLY_PRICE_ID=${prices.premiumMonthly}`);
    console.log(`STRIPE_PREMIUM_YEARLY_PRICE_ID=${prices.premiumYearly}`);
    console.log('STRIPE_WEBHOOK_SECRET=whsec_... (create webhook first)');

    console.log('\n📌 Next Steps:');
    console.log('1. Get your publishable key from: https://dashboard.stripe.com/apikeys');
    console.log('2. Create a webhook endpoint at: https://dashboard.stripe.com/webhooks');
    console.log('   - Endpoint URL: https://your-domain.com/api/stripe/webhook');
    console.log('   - Events to listen for:');
    console.log('     • checkout.session.completed');
    console.log('     • customer.subscription.updated');
    console.log('     • customer.subscription.deleted');
    console.log('     • invoice.payment_succeeded');
    console.log('     • invoice.payment_failed');
    console.log('3. Copy the webhook signing secret (starts with whsec_)');
    console.log('\n🧪 Test card: 4242 4242 4242 4242 (any future date, any CVC)\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.log('\nMake sure you\'re using a valid Stripe secret key.');
      console.log('Get it from: https://dashboard.stripe.com/apikeys\n');
    }
    process.exit(1);
  }
}

// Run setup
const secretKey = process.argv[2];
setupStripe(secretKey);
