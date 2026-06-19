/**
 * ECG / PURC Ghana Electricity Tariffs
 *
 * Source: PURC "2026 Second Quarter Tariff Review Decision for Electricity
 * and Water" — official release dated 13-03-2026, effective April 01, 2026.
 * https://www.purc.com.gh/attachment/288818-20260313090334.pdf
 *
 * Q2 2026 adjustment: average -4.81% on electricity (varies by customer
 * category — see Table 2 of the decision), driven by cedi appreciation
 * (GHS/USD 12.0067 → 11.1931) and falling inflation (8.00% → 4.17%).
 *
 * IMPORTANT — how lifeline actually works:
 * Lifeline is a SEPARATE registered customer category, not an automatic
 * "first 30 kWh" discount applied to every residential bill. A normal
 * residential customer's entire consumption — including their first
 * 30 kWh — is billed at the residential 0–300 kWh rate. Only customers
 * specifically registered as lifeline (very low, verified consumption)
 * get the cheaper 0.8690/kWh band. We keep `lifeline` and `residential`
 * as fully separate tariff configs (no shared band) to reflect this.
 *
 * PURC reviews tariffs quarterly via the Automatic Adjustment Formula (AAF).
 * Always verify against https://purc.com.gh before a release.
 * Update `lastUpdated` and band rates when PURC issues a new quarterly
 * adjustment (typically early Jan / Apr / Jul / Oct).
 */

import { TariffConfig, TariffType } from "@/types";

export const TARIFFS: Record<TariffType, TariffConfig> = {
  /**
   * Residential tariff — standard household, NOT registered lifeline.
   * Tiered: 0–300 kWh, then 301+ kWh. Flat monthly service charge applies
   * regardless of which band consumption lands in (it's a connection fee,
   * not a per-band fee).
   */
  residential: {
    type: 'residential',
    label: 'Residential',
    description: 'Standard home user',
    lastUpdated: '2026-04-01', // PURC Q2 2026 quarterly adjustment
    bands: [
      {
        minKwh: 0,
        maxKwh: 300,
        ratePerKwh: 1.968825,  // 196.8825 GHp/kWh
        serviceChargePerMonth: 10.730886, // 1073.0886 GHp/month, flat
      },
      {
        minKwh: 300,
        maxKwh: null,
        ratePerKwh: 2.601481,  // 260.1481 GHp/kWh
        serviceChargePerMonth: 10.730886, // same flat connection charge
      },
    ],
  },

  /**
   * Lifeline tariff — separately registered low-consumption households.
   * Single band, capped at 30 kWh/month. If a lifeline customer exceeds
   * 30 kWh in a month, ECG bills the excess at the standard residential
   * rate (not modeled here — out of scope for the prepaid estimator,
   * since lifeline customers are by definition very low consumption).
   */
  lifeline: {
    type: 'lifeline',
    label: 'Lifeline',
    description: 'Registered low-consumption household (≤ 30 kWh/month)',
    lastUpdated: '2026-04-01',
    bands: [
      {
        minKwh: 0,
        maxKwh: 30,
        ratePerKwh: 0.8690,    // 86.9000 GHp/kWh
        serviceChargePerMonth: 2.13, // 213.0000 GHp/month
      },
    ],
  },

  /**
   * Non-Residential / Business tariff — shops, offices, small businesses
   * on the standard low-voltage grid. Tiered the same way as residential:
   * 0–300 kWh, then 301+ kWh, plus a flat monthly service charge.
   */
  business: {
    type: 'business',
    label: 'Business / Non-Residential',
    description: 'Shops, offices, small businesses',
    lastUpdated: '2026-04-01',
    bands: [
      {
        minKwh: 0,
        maxKwh: 300,
        ratePerKwh: 1.777539,  // 177.7539 GHp/kWh
        serviceChargePerMonth: 12.428245, // 1242.8245 GHp/month
      },
      {
        minKwh: 300,
        maxKwh: null,
        ratePerKwh: 2.164873,  // 216.4873 GHp/kWh
        serviceChargePerMonth: 12.428245,
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
  // Service charge is flat per customer category — same across all
  // bands in that category, so any band's value works. Use the first.
  return config.bands[0].serviceChargePerMonth;
}

/** Human-readable rate label e.g. "₵1.97 / kWh" */
export function formatRate(tariffType: TariffType): string {
  // Primary/dominant band = the first band above any lifeline-style cap,
  // i.e. the band most customers in this category actually fall into.
  const primaryBand =
    TARIFFS[tariffType].bands.find((b) => b.minKwh === 0) ??
    TARIFFS[tariffType].bands[0];
  return `₵${primaryBand.ratePerKwh.toFixed(2)} / kWh`;
}