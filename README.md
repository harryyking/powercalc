# PowerCalc GH — React Native Expo App
## ECG Prepaid Electricity Estimator for Ghanaians

---

## Quick Start

```bash
# 1. Create the Expo project (run this first)
npx create-expo-app@latest PowerCalcGH --template tabs
cd PowerCalcGH

# 2. Install required dependencies
npx expo install @react-native-async-storage/async-storage
npx expo install @react-native-community/slider
npx expo install react-native-safe-area-context
npx expo install expo-sharing
npx expo install expo-notifications

# 3. Copy all files from this scaffold into the project
#    (types/, constants/, hooks/, store/, components/, app/)

# 4. Start dev server
npx expo start
```

---

## Project Structure

```
PowerCalcGH/
│
├── types/
│   └── index.ts              ← All TypeScript interfaces
│
├── constants/
│   ├── tariffs.ts            ← PURC tariff rates (update quarterly)
│   └── appliances.ts         ← All 25+ appliances with Ghana defaults
│
├── hooks/
│   └── useCalculator.ts      ← Core calculation logic + formatters
│
├── store/
│   └── historyStore.ts       ← AsyncStorage credit history
│
├── components/
│   ├── ApplianceCard.tsx     ← Tap-to-toggle appliance tile
│   └── ResultCard.tsx        ← Days-left result + breakdown bars
│
└── app/
    └── (tabs)/
        └── index.tsx         ← Calculator home screen
```

---

## Tariff Update Process (every quarter)

PURC adjusts tariffs quarterly via the Automatic Adjustment Formula (AAF).
When a new rate is announced, **only update `constants/tariffs.ts`**:

1. Check: https://purc.com.gh → Tariffs → Current Electricity Tariffs
2. Update `ratePerKwh` values in the `TARIFFS` object
3. Update `lastUpdated` date string
4. Submit an OTA update via `eas update` — no App Store review needed

```ts
// Example: updating residential band
residential: {
  bands: [
    { minKwh: 0,  maxKwh: 30,   ratePerKwh: 0.8690,  ... }, // lifeline
    { minKwh: 30, maxKwh: 300,  ratePerKwh: 1.9688,  ... }, // ← update this
    { minKwh: 300, maxKwh: null, ratePerKwh: 2.1500, ... }, // ← and this
  ],
  lastUpdated: '2026-07-01', // ← and this
}
```

---

## Key Design Decisions

### Why not fetch tariffs from an API?
- PURC has no public API
- Tariffs only change quarterly — hardcoding is fine
- Offline-first is better UX for Ghanaians (spotty data)
- OTA updates via EAS handle rate changes without App Store review delays

### Why tiered calculation in creditToKwh()?
The lifeline band (0–30 kWh) costs ₵0.87/kWh while the next band costs
₵1.97/kWh. For a ₵50 top-up, the first ~26 kWh are cheaper. Ignoring this
gives the wrong answer for small top-ups.

### Why prorate the ECG service charge?
ECG deducts ~₵3.50/month as a fixed service charge from prepaid credit.
For someone buying ₵20, that's a significant chunk. We prorate it so the
app gives an honest picture of usable credit.

### Why AsyncStorage and not a backend?
- Zero infrastructure cost
- Works offline (important during dumsor)
- No privacy concerns / GDPR issues
- Sufficient for the use case — history is personal, not shared

---

## Monetization

| Feature | Free | Premium (₵9.99/month) |
|---|---|---|
| Calculator | ✅ | ✅ |
| All appliances | ✅ | ✅ |
| History (last 5) | ✅ | Unlimited |
| Ads (AdMob) | ✅ | ❌ |
| Home screen widget | ❌ | ✅ |
| Tariff update alerts | ❌ | ✅ push notification |
| CSV export | ❌ | ✅ |

---

## Screens to Build Next

- [ ] `app/(tabs)/history.tsx` — credit log with actual vs estimated
- [ ] `app/(tabs)/tips.tsx` — energy saving tips by appliance category
- [ ] `app/result.tsx` — full-screen result (for sharing)
- [ ] `components/TariffPicker.tsx` — standalone tariff picker sheet
- [ ] `components/CreditInput.tsx` — custom numeric keypad

---

## Current Tariff Reference (April 2026)

| Customer Type | Band | Rate (GHS/kWh) |
|---|---|---|
| Residential | 0–30 kWh (lifeline) | ₵0.8690 |
| Residential | 30–300 kWh | ₵1.9688 |
| Residential | 300+ kWh | ₵2.1500 |
| Lifeline | 0–30 kWh only | ₵0.8690 |
| Business (SLT LV) | All bands | ₵1.8980 |

Source: PURC MYTO 2026–2030 + April 2026 quarterly AAF adjustment
E-Levy: **ABOLISHED** April 3, 2025 — no longer applies to any transactions.

---

## App Store Listing Tips (based on SendSmart experience)

**Name:** ECG Calculator— ECG Units
**Subtitle:** How long will your credit last?
**Keywords:** ECG, electricity, prepaid, units, Ghana, PURC, kWh, dumsor, light bill
**Screenshots:** Show the main result — "Your ₵50 will last 4 days" — big and clear on first screenshot.