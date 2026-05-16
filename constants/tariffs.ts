

/**
 * ECG / PURC Ghana Electricity Tariffs
 *
 * Sources:
 *  - PURC Multi-Year Tariff Order (MYTO) 2026–2030 — effective January 2026
 *  - April 2026 quarterly adjustment: 4.81% reduction (cedi appreciation + falling inflation)
 *  - GlobalPetrolPrices.com Ghana — June 2025 residential: GHS 1.820/kWh
 *  - AccraStreetJournal.com — residential 0–300 kWh: GHS 1.9688/kWh (post Jan 2026 MYTO)
 *  - Lifeline band (0–30 kWh): GHS 0.8690/kWh
 *  - E-Levy: ABOLISHED April 3 2025 by President Mahama — no longer applies
 *
 * IMPORTANT: PURC reviews tariffs quarterly via the Automatic Adjustment Formula (AAF).
 * Always verify against https://purc.com.gh before a release.
 * Update `lastUpdated` and band rates when PURC issues a new quarterly adjustment.
 */

import { TariffConfig, TariffType } from "@/types";

export const TARIFFS: Record<TariffType, TariffConfig> = {
  /**
   * Residential tariff — typical household
   * Tiered: lifeline band (0–30 kWh) is subsidised.
   * Above 30 kWh the standard residential rate applies.
   */
  residential: {
    type: 'residential',
    label: 'Residential',
    description: 'Standard home user',
    lastUpdated: '2026-04-01', // April 2026 quarterly adjustment
    bands: [
      {
        minKwh: 0,
        maxKwh: 30,
        ratePerKwh: 0.8690,   // Lifeline subsidy band
        serviceChargePerMonth: 0,
      },
      {
        minKwh: 30,
        maxKwh: 300,
        ratePerKwh: 1.9688,   // Standard residential
        serviceChargePerMonth: 3.50, // ECG fixed service charge (approx)
      },
      {
        minKwh: 300,
        maxKwh: null,
        ratePerKwh: 2.1500,   // High consumption band
        serviceChargePerMonth: 3.50,
      },
    ],
  },

  /**
   * Lifeline tariff — low-income / very low consumption households
   * Applies when total monthly usage stays within 0–30 kWh.
   * If usage exceeds 30 kWh in a month, the full residential rate kicks in.
   */
  lifeline: {
    type: 'lifeline',
    label: 'Lifeline',
    description: 'Low-consumption household (≤ 30 kWh/month)',
    lastUpdated: '2026-04-01',
    bands: [
      {
        minKwh: 0,
        maxKwh: 30,
        ratePerKwh: 0.8690,
        serviceChargePerMonth: 0,
      },
    ],
  },

  /**
   * Non-Residential / Business tariff (SLT LV — Small & Large Tertiary, Low Voltage)
   * For shops, offices, small businesses on the standard low-voltage grid.
   */
  business: {
    type: 'business',
    label: 'Business / Non-Residential',
    description: 'Shops, offices, small businesses',
    lastUpdated: '2026-04-01',
    bands: [
      {
        minKwh: 0,
        maxKwh: null,
        ratePerKwh: 1.8980,
        serviceChargePerMonth: 8.00, // higher fixed charge for commercial
      },
    ],
  },
};

/**
 * Returns the effective rate per kWh for a given tariff type and
 * estimated monthly consumption. Handles the tiered residential structure.
 *
 * For simplicity in the prepaid estimator we use the DOMINANT band —
 * i.e. the band that covers the bulk of consumption given the credit entered.
 * A full tiered calculation is done in useCalculator for accuracy.
 */
export function getEffectiveRate(
  tariffType: TariffType,
  estimatedMonthlyKwh: number,
): number {
  const config = TARIFFS[tariffType];
  const band = config.bands.find(
    (b) =>
      estimatedMonthlyKwh >= b.minKwh &&
      (b.maxKwh === null || estimatedMonthlyKwh < b.maxKwh),
  );
  return band?.ratePerKwh ?? config.bands[config.bands.length - 1].ratePerKwh;
}

/**
 * Computes the total cost (GHS) for a given kWh amount under tiered pricing.
 * Walks through each band and accumulates cost per tier.
 */
export function computeTieredCost(
  tariffType: TariffType,
  kwhAmount: number,
): number {
  const { bands } = TARIFFS[tariffType];
  let remaining = kwhAmount;
  let totalCost = 0;

  for (const band of bands) {
    if (remaining <= 0) break;
    const bandCapacity =
      band.maxKwh !== null ? band.maxKwh - band.minKwh : Infinity;
    const kwhInBand = Math.min(remaining, bandCapacity);
    totalCost += kwhInBand * band.ratePerKwh;
    remaining -= kwhInBand;
  }

  return totalCost;
}

/**
 * Reverse: given a GHS amount, how many kWh can you buy?
 * Walks through bands and deducts cost per tier.
 */
export function creditToKwh(
  tariffType: TariffType,
  creditGhs: number,
): number {
  const { bands } = TARIFFS[tariffType];
  let remainingCredit = creditGhs;
  let totalKwh = 0;

  for (const band of bands) {
    if (remainingCredit <= 0) break;
    const bandCapacity =
      band.maxKwh !== null ? band.maxKwh - band.minKwh : Infinity;
    const maxCostInBand = bandCapacity * band.ratePerKwh;

    if (remainingCredit >= maxCostInBand) {
      totalKwh += bandCapacity;
      remainingCredit -= maxCostInBand;
    } else {
      totalKwh += remainingCredit / band.ratePerKwh;
      remainingCredit = 0;
    }
  }

  return totalKwh;
}

/** Monthly service charges by tariff type */
export function getServiceCharge(tariffType: TariffType): number {
  const config = TARIFFS[tariffType];
  // Use the primary (non-lifeline) band's service charge
  const mainBand = config.bands[config.bands.length - 1];
  return mainBand.serviceChargePerMonth;
}

/** Human-readable rate label e.g. "₵1.97 / kWh" */
export function formatRate(tariffType: TariffType): string {
  const primaryBand = TARIFFS[tariffType].bands.find(
    (b) => b.maxKwh === null || b.maxKwh > 30,
  );
  const rate = primaryBand?.ratePerKwh ?? TARIFFS[tariffType].bands[0].ratePerKwh;
  return `₵${rate.toFixed(2)} / kWh`;
}