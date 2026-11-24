import { calculateDynamicPricing } from './pricingUtils';
import { PricingConfig } from '../database/schema';

describe('calculateDynamicPricing', () => {
  const samplePricingConfig: PricingConfig = {
    tiers: [
      { minPax: 1, maxPax: 1, pricePerPerson: 200, label: 'Solo Traveler (1 Pax)' },
      { minPax: 2, maxPax: 2, pricePerPerson: 150, label: 'Pair / Couple (2 Pax)' },
      { minPax: 3, maxPax: 4, pricePerPerson: 120, label: 'Small Group (3-4 Pax)' },
      { minPax: 5, maxPax: 8, pricePerPerson: 100, label: 'Medium Group (5-8 Pax)' },
    ],
    passengerPricing: {
      couplePricingType: 'auto_tier',
      childRateType: 'percentage',
      childRateValue: 50,
      infantPrice: 0,
    },
    options: [],
  };

  it('should match 2-Pax tier (NOT 3-Pax) when booking 1 Couple (2 adults) + 1 Child', () => {
    const result = calculateDynamicPricing(
      150,
      { couple: 1, child: 1 },
      samplePricingConfig,
    );

    // Active tier must be strictly determined by effectiveAdults (1 couple = 2 adults)
    expect(result.activeTier).toBeDefined();
    expect(result.activeTier?.minPax).toBe(2);
    expect(result.activeTier?.maxPax).toBe(2);
    expect(result.activeTier?.label).toBe('Pair / Couple (2 Pax)');
    expect(result.unitPrice).toBe(150);

    // Total paying headcount includes child
    expect(result.totalPax).toBe(3);

    // Couple breakdown: 1 couple @ 2 * 150 = 300
    expect(result.breakdown.couples.count).toBe(1);
    expect(result.breakdown.couples.unitPrice).toBe(300);
    expect(result.breakdown.couples.total).toBe(300);

    // Child breakdown: 1 child @ 50% of 150 = 75
    expect(result.breakdown.children.count).toBe(1);
    expect(result.breakdown.children.unitPrice).toBe(75);
    expect(result.breakdown.children.total).toBe(75);

    // Grand total: 300 + 75 = 375
    expect(result.totalPrice).toBe(375);
  });

  it('should match 4-Pax tier when booking 2 Couples (4 adults)', () => {
    const result = calculateDynamicPricing(
      150,
      { couples: 2 },
      samplePricingConfig,
    );

    // Effective adults = 2 couples * 2 = 4 adults -> Falls into Tier 3 (3-4 Pax)
    expect(result.activeTier).toBeDefined();
    expect(result.activeTier?.minPax).toBe(3);
    expect(result.activeTier?.maxPax).toBe(4);
    expect(result.activeTier?.label).toBe('Small Group (3-4 Pax)');
    expect(result.unitPrice).toBe(120);

    expect(result.totalPax).toBe(4);

    // Couple breakdown: 2 couples @ 2 * 120 = 240 each -> total 480
    expect(result.breakdown.couples.count).toBe(2);
    expect(result.breakdown.couples.unitPrice).toBe(240);
    expect(result.breakdown.couples.total).toBe(480);
    expect(result.totalPrice).toBe(480);
  });

  it('should match 1-Pax tier when booking 1 Adult + 2 Children without modifying adult tier', () => {
    const result = calculateDynamicPricing(
      200,
      { adults: 1, children: 2 },
      samplePricingConfig,
    );

    // Effective adults = 1 -> Falls into Solo (1 Pax) tier
    expect(result.activeTier?.minPax).toBe(1);
    expect(result.activeTier?.maxPax).toBe(1);
    expect(result.unitPrice).toBe(200);

    expect(result.totalPax).toBe(3); // 1 adult + 2 children
    expect(result.breakdown.adults.total).toBe(200);
    expect(result.breakdown.children.unitPrice).toBe(100); // 50% of 200
    expect(result.breakdown.children.total).toBe(200); // 2 * 100
    expect(result.totalPrice).toBe(400);
  });

  it('should handle custom fixed couple price and fixed child fee', () => {
    const customConfig: PricingConfig = {
      ...samplePricingConfig,
      passengerPricing: {
        couplePricingType: 'fixed',
        coupleFixedPrice: 280,
        childRateType: 'fixed',
        childRateValue: 60,
        infantPrice: 15,
      },
    };

    const result = calculateDynamicPricing(
      150,
      { couple: 1, child: 2, infant: 1 },
      customConfig,
    );

    expect(result.activeTier?.minPax).toBe(2);
    expect(result.breakdown.couples.unitPrice).toBe(280);
    expect(result.breakdown.couples.total).toBe(280);
    expect(result.breakdown.children.unitPrice).toBe(60);
    expect(result.breakdown.children.total).toBe(120);
    expect(result.breakdown.infants.unitPrice).toBe(15);
    expect(result.breakdown.infants.total).toBe(15);
    expect(result.totalPrice).toBe(415); // 280 + 120 + 15
  });
});
