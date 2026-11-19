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
 * Correctly calculates Group Tiers, Couples (2-pax rooms), Child discounts, and Infants.
 */
export function calculateDynamicPricing(
  basePrice: number,
  travelerCounts: Record<string, number> = {},
  pricingConfig?: PricingConfig,
): PricingCalculationResult {
  // Fallback safe base price
  const fallbackPrice =
    typeof basePrice === 'number' && !isNaN(basePrice)
      ? basePrice
      : Number(basePrice) || 0;

  // 1. Extract counts safely (handles both singular: 'adult' and plural: 'adults')
  const adults = Math.max(
    0,
    Number(travelerCounts.adult ?? travelerCounts.adults ?? 0),
  );

  // In the UI, 'couple' count represents the number of Couples (rooms/pairs, e.g. 2 Couples)
  const coupleCount = Math.max(
    0,
    Number(travelerCounts.couple ?? travelerCounts.couples ?? 0),
  );
  // Each couple consists of 2 adult persons
  const couplePersons = coupleCount * 2;

  const children = Math.max(
    0,
    Number(travelerCounts.child ?? travelerCounts.children ?? 0),
  );
  const infants = Math.max(
    0,
    Number(travelerCounts.infant ?? travelerCounts.infants ?? 0),
  );

  // Total paying travelers headcount (determines Group Discount Tier)
  // Note: Infants travel free on lap and do not count toward paying group discount tiers
  const totalPax = adults + couplePersons + children;

  const tiers = pricingConfig?.tiers;
  const passengerPricing = pricingConfig?.passengerPricing;

  let unitPrice = fallbackPrice;
  let activeTier: GroupPricingTier | undefined;
  let isTierPricingApplied = false;

  // 2. Match Active Group Discount Tier by totalPax
  if (tiers && Array.isArray(tiers) && tiers.length > 0) {
    if (totalPax > 0) {
      // Find tier where totalPax falls between minPax and maxPax
      activeTier = tiers.find(
        (tier) =>
          totalPax >= Number(tier.minPax) && totalPax <= Number(tier.maxPax),
      );

      // If totalPax exceeds the highest tier, apply the largest group discount rate
      if (!activeTier) {
        const sortedAsc = [...tiers].sort(
          (a, b) => Number(a.minPax) - Number(b.minPax),
        );
        const highestTier = sortedAsc[sortedAsc.length - 1];
        const lowestTier = sortedAsc[0];

        if (totalPax >= Number(highestTier.maxPax || highestTier.minPax)) {
          activeTier = highestTier;
        } else {
          activeTier = lowestTier;
        }
      }

      if (activeTier) {
        unitPrice = Number(activeTier.pricePerPerson) || fallbackPrice;
        isTierPricingApplied = true;
      }
    } else {
      // If 0 travelers selected, default to Solo (1 pax) tier rate
      const soloTier = tiers.find((t) => Number(t.minPax) === 1) || tiers[0];
      if (soloTier) {
        unitPrice = Number(soloTier.pricePerPerson) || fallbackPrice;
        activeTier = soloTier;
      }
    }
  }

  // 3. Adults Total
  const adultTotal = adults * unitPrice;

  // 4. Couples Total (2 Adults in 1 Room)
  // Rate is either Custom Fixed Couple Rate or Auto (2 x active tier rate)
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

  // 5. Children Total (Percentage discount or fixed rate)
  let childUnitPrice = unitPrice * 0.5; // Default 50% discount if unconfigured
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

  // 8. Return rounded results to prevent JavaScript floating point decimals
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
        count: coupleCount, // Passes the actual number of Couples (e.g. 2, NOT 4)
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
