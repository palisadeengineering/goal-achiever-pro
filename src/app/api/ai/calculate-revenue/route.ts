import { NextRequest, NextResponse } from 'next/server';
import type {
  CalculateRevenueRequest,
  CalculateRevenueResponse,
  RevenueOption,
} from '@/types/strategic-discovery';

// Pure math endpoint - no AI needed, just calculations
export async function POST(request: NextRequest) {
  try {
    const body: CalculateRevenueRequest = await request.json();
    const { targetRevenue, revenueType, targetDate, currentRevenue = 0 } = body;

    if (!targetRevenue || targetRevenue <= 0) {
      return NextResponse.json(
        { error: 'Valid target revenue is required' },
        { status: 400 }
      );
    }

    if (!targetDate) {
      return NextResponse.json(
        { error: 'Target date is required' },
        { status: 400 }
      );
    }

    // Calculate months remaining
    const today = new Date();
    const target = new Date(targetDate);
    const monthsRemaining = Math.max(
      1,
      Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30))
    );

    // Calculate monthly and yearly targets
    let monthlyTarget: number;
    let yearlyTarget: number;

    if (revenueType === 'arr') {
      yearlyTarget = targetRevenue;
      monthlyTarget = targetRevenue / 12;
    } else if (revenueType === 'mrr') {
      monthlyTarget = targetRevenue;
      yearlyTarget = targetRevenue * 12;
    } else {
      // one-time revenue - spread across remaining months
      monthlyTarget = targetRevenue / monthsRemaining;
      yearlyTarget = targetRevenue;
    }

    // Adjust for current revenue
    const remainingMonthlyTarget = monthlyTarget - (currentRevenue / 12);
    const effectiveMonthlyTarget = Math.max(0, remainingMonthlyTarget);

    // Generate pricing model options
    const pricingModels = [
      { name: 'Mass Market', price: 10, notes: 'High volume, requires viral growth or massive ad spend' },
      { name: 'Prosumer', price: 29, notes: 'Sweet spot for solo founders. Motivated users who value quality' },
      { name: 'SMB Starter', price: 49, notes: 'Small business entry point. Good balance of volume and value' },
      { name: 'SMB Pro', price: 79, notes: 'Small business focus. Higher touch, better retention' },
      { name: 'Enterprise Lite', price: 149, notes: 'Growing companies. Requires some sales effort' },
      { name: 'Enterprise', price: 299, notes: 'Fewer customers, higher touch. Longer sales cycles' },
    ];

    const options: RevenueOption[] = pricingModels.map((model) => {
      const customersNeeded = Math.ceil(effectiveMonthlyTarget / model.price);
      const newCustomersPerMonth = Math.ceil(customersNeeded / monthsRemaining);

      // Determine if recommended based on typical constraints
      // Prosumer ($29-79) is typically best for solo/small teams
      const isRecommended = model.price >= 29 && model.price <= 79 &&
        customersNeeded >= 50 && customersNeeded <= 5000;

      return {
        name: model.name,
        pricePerMonth: model.price,
        customersNeeded,
        description: `${model.notes}. Need ~${newCustomersPerMonth} new customers/month to hit target.`,
        recommended: isRecommended,
      };
    });

    // Find the recommended option (or default to Prosumer)
    let recommendedOption = options.find(o => o.recommended);
    if (!recommendedOption) {
      // Default recommendation based on target size
      if (effectiveMonthlyTarget < 5000) {
        recommendedOption = options.find(o => o.pricePerMonth === 29);
      } else if (effectiveMonthlyTarget < 20000) {
        recommendedOption = options.find(o => o.pricePerMonth === 79);
      } else {
        recommendedOption = options.find(o => o.pricePerMonth === 149);
      }
      if (recommendedOption) {
        recommendedOption.recommended = true;
      }
    }

    // Generate math breakdown
    const formatCurrency = (n: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

    const mathBreakdown = revenueType === 'arr'
      ? `${formatCurrency(yearlyTarget)} ARR ÷ 12 months = ${formatCurrency(monthlyTarget)} MRR needed`
      : revenueType === 'mrr'
      ? `${formatCurrency(monthlyTarget)} MRR × 12 months = ${formatCurrency(yearlyTarget)} ARR potential`
      : `${formatCurrency(targetRevenue)} target ÷ ${monthsRemaining} months = ${formatCurrency(monthlyTarget)}/month`;

    // Generate recommendation text
    let recommendation = '';
    if (recommendedOption) {
      const growthRate = Math.ceil(recommendedOption.customersNeeded / monthsRemaining);
      recommendation = `At ${formatCurrency(recommendedOption.pricePerMonth)}/month (${recommendedOption.name}), you need ${recommendedOption.customersNeeded.toLocaleString()} paying customers. `;
      recommendation += `That's ~${growthRate} new customers per month for ${monthsRemaining} months. `;

      if (growthRate <= 10) {
        recommendation += 'This is very achievable with organic growth.';
      } else if (growthRate <= 50) {
        recommendation += 'Achievable with consistent content marketing and some paid acquisition.';
      } else if (growthRate <= 200) {
        recommendation += 'You\'ll need a strong acquisition engine. Consider partnerships or paid ads.';
      } else {
        recommendation += 'This is aggressive. Consider raising prices or extending timeline.';
      }
    }

    const response: CalculateRevenueResponse = {
      monthlyTarget: Math.round(monthlyTarget * 100) / 100,
      yearlyTarget: Math.round(yearlyTarget * 100) / 100,
      monthsRemaining,
      options,
      recommendation,
      mathBreakdown,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Revenue Calculation Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate revenue options' },
      { status: 500 }
    );
  }
}
