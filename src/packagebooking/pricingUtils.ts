import { PricingConfig, GroupPricingTier } from '../database/schema';

export interface CategoryBreakdown {
  count: number;
  unitPrice: number;
  total: number;
  discountNote?: string;
}

export interface PricingCalculationResult {
  unitPrice: number;
  totalPrice: number;
  activeTier?: GroupPricingTier;
  totalPax: number;
  isTierPricingApplied: boolean;
  breakdown: {
    adults: CategoryBreakdown;
    couples: CategoryBreakdown;
    children: CategoryBreakdown;
    infants: CategoryBreakdown;
  };
}

/**
 * Fully Optimized Dynamic Tour Pricing Calculator
 * Industry Standard: Group Discount Tiers are determined strictly by ADULT travelers (adults + couples * 2).
 * Children and infants pay their designated rates and do not dilute the adult group tier.
 */
export function calculateDynamicPricing(
  basePrice: number,
  travelerCounts: Record<string, number> = {},
  pricingConfig?: PricingConfig,
): PricingCalculationResult {
  const fallbackPrice =
    typeof basePrice === 'number' && !isNaN(basePrice)
      ? basePrice
      : Number(basePrice) || 0;

  // 1. Extract counts safely (handles both singular and plural keys)
  const adults = Math.max(
    0,
    Number(travelerCounts.adult ?? travelerCounts.adults ?? 0),
  );
  const coupleCount = Math.max(
    0,
    Number(travelerCounts.couple ?? travelerCounts.couples ?? 0),
  );
  const couplePersons = coupleCount * 2; // 1 couple = 2 adults

  const children = Math.max(
    0,
    Number(travelerCounts.child ?? travelerCounts.children ?? 0),
  );
  const infants = Math.max(
    0,
    Number(travelerCounts.infant ?? travelerCounts.infants ?? 0),
  );

  // Industry Standard: Adult pax determines the Group Discount Tier
  const effectiveAdults = adults + couplePersons;

  // Total paying travelers headcount
  const totalPax = effectiveAdults + children;

  const tiers = pricingConfig?.tiers;
  const passengerPricing = pricingConfig?.passengerPricing;

  let unitPrice = fallbackPrice;
  let activeTier: GroupPricingTier | undefined;
  let isTierPricingApplied = false;

  // 2. Match Active Group Discount Tier strictly by Adult Travelers
  if (tiers && Array.isArray(tiers) && tiers.length > 0) {
    const adultPaxLookup = effectiveAdults > 0 ? effectiveAdults : 1;
    activeTier = tiers.find(
      (tier) =>
        adultPaxLookup >= Number(tier.minPax) &&
        adultPaxLookup <= Number(tier.maxPax),
    );

    if (!activeTier) {
      const sortedAsc = [...tiers].sort(
        (a, b) => Number(a.minPax) - Number(b.minPax),
      );
      const highestTier = sortedAsc[sortedAsc.length - 1];
      const lowestTier = sortedAsc[0];

      if (adultPaxLookup >= Number(highestTier.maxPax || highestTier.minPax)) {
        activeTier = highestTier;
      } else {
        activeTier = lowestTier;
      }
    }

    if (activeTier) {
      unitPrice = Number(activeTier.pricePerPerson) || fallbackPrice;
      isTierPricingApplied = effectiveAdults > 0;
    }
  }

  // 3. Adults Total
  const adultTotal = adults * unitPrice;

  // 4. Couples Total (2 Adults in 1 Room)
  let coupleUnitRate = unitPrice * 2;
  let coupleTotal = 0;
  let coupleNote = '2 Adults (Shared Room)';

  if (coupleCount > 0) {
    if (
      passengerPricing?.couplePricingType === 'fixed' &&
      typeof passengerPricing.coupleFixedPrice === 'number' &&
      passengerPricing.coupleFixedPrice > 0
    ) {
      coupleUnitRate = Number(passengerPricing.coupleFixedPrice);
      coupleNote = 'Fixed Couple Rate';
    } else {
      coupleUnitRate = unitPrice * 2;
      coupleNote = '2 × Adult Tier Rate';
    }
    coupleTotal = coupleCount * coupleUnitRate;
  }

  // 5. Children Total (Percentage of active Adult Tier or fixed rate)
  let childUnitPrice = unitPrice * 0.5;
  let childDiscountNote = '50% of adult rate';

  if (passengerPricing) {
    if (passengerPricing.childRateType === 'fixed') {
      childUnitPrice =
        typeof passengerPricing.childRateValue === 'number' &&
        passengerPricing.childRateValue >= 0
          ? Number(passengerPricing.childRateValue)
          : unitPrice;
      childDiscountNote = 'Fixed child fee';
    } else {
      const percent =
        typeof passengerPricing.childRateValue === 'number' &&
        passengerPricing.childRateValue > 0
          ? Number(passengerPricing.childRateValue)
          : 50;
      childUnitPrice = (unitPrice * percent) / 100;
      childDiscountNote = `${percent}% of adult rate`;
    }
  }
  const childTotal = children * childUnitPrice;

  // 6. Infants Total (Usually Free / 0)
  const infantUnitPrice =
    passengerPricing &&
    typeof passengerPricing.infantPrice === 'number' &&
    passengerPricing.infantPrice >= 0
      ? Number(passengerPricing.infantPrice)
      : 0;
  const infantTotal = infants * infantUnitPrice;

  // 7. Final Grand Total
  const totalPrice = adultTotal + coupleTotal + childTotal + infantTotal;

  // 8. Return rounded results to prevent floating point issues
  return {
    unitPrice: Math.round(unitPrice * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
    activeTier,
    totalPax,
    isTierPricingApplied,
    breakdown: {
      adults: {
        count: adults,
        unitPrice: Math.round(unitPrice * 100) / 100,
        total: Math.round(adultTotal * 100) / 100,
      },
      couples: {
        count: coupleCount,
        unitPrice: Math.round(coupleUnitRate * 100) / 100,
        total: Math.round(coupleTotal * 100) / 100,
        discountNote: coupleNote,
      },
      children: {
        count: children,
        unitPrice: Math.round(childUnitPrice * 100) / 100,
        total: Math.round(childTotal * 100) / 100,
        discountNote: childDiscountNote,
      },
      infants: {
        count: infants,
        unitPrice: Math.round(infantUnitPrice * 100) / 100,
        total: Math.round(infantTotal * 100) / 100,
        discountNote: infantUnitPrice === 0 ? 'Free (Under 2)' : 'Infant fee',
      },
    },
  };
}
