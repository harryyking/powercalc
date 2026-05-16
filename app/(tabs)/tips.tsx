/**
 * app/(tabs)/tips.tsx — Energy Saving Tips Screen
 */
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import Text from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TARIFFS } from '../../constants/tariffs';

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  background:      '#121212',
  surface:         '#1a1a1a',
  card:            '#171717',
  secondary:       '#242424',
  border:          '#292929',
  foreground:      '#e2e8f0',
  mutedForeground: '#a2a2a2',
  primary:         '#006239',
  primaryLight:    '#00a862',
  primaryForeground: '#dde8e3',
  ring:            '#4ade80',
  amber:           '#F59E0B',
  amberDim:        'rgba(245,158,11,0.1)',
  sm: 8, md: 14, lg: 20, xl: 28, pill: 999,
};

// ─── Tip data ─────────────────────────────────────────────────────────────────
interface Tip {
  id: string;
  title: string;
  body: string;
  savingKwhPerMonth: number;
  emoji: string;
  impact: 'high' | 'medium' | 'low';
}
interface TipCategory {
  id: string;
  label: string;
  emoji: string;
  tips: Tip[];
}

const RATE = TARIFFS.residential.bands[1].ratePerKwh;

const TIP_CATEGORIES: TipCategory[] = [
  {
    id: 'cooling', label: 'Cooling & AC', emoji: '❄️',
    tips: [
      { id: 'ac_temp',    title: 'Set AC to 24–26°C',                  body: 'Every degree below 24°C adds roughly 8% to your AC bill. Setting it to 26°C instead of 18°C can cut AC consumption nearly in half.',                                                                       savingKwhPerMonth: 36, emoji: '🌡️', impact: 'high'   },
      { id: 'ac_service', title: 'Service your AC every 6 months',      body: 'A dirty filter makes the AC work harder. A clean, serviced AC uses up to 15% less electricity for the same cooling effect.',                                                                                   savingKwhPerMonth: 18, emoji: '🔧', impact: 'medium' },
      { id: 'fan_first',  title: 'Use fan before switching on AC',       body: 'A ceiling fan uses 75W vs 900W+ for AC. Run the fan for 30 minutes before turning on the AC — it pre-cools the room and reduces AC run time.',                                                                 savingKwhPerMonth: 25, emoji: '🌀', impact: 'high'   },
      { id: 'ac_off',     title: 'Switch AC off 30 mins before leaving', body: 'The room stays cool for at least 30 minutes after you turn off the AC. This simple habit can save 1 hour of AC per day.',                                                                                      savingKwhPerMonth: 27, emoji: '⏰', impact: 'high'   },
    ],
  },
  {
    id: 'kitchen', label: 'Kitchen', emoji: '🍳',
    tips: [
      { id: 'gas_cooking',  title: 'Use gas for heavy cooking',         body: 'Electric cookers are expensive in Ghana. Using LPG gas for boiling, stewing, and frying — and only using electric for reheating — can save significantly.',                      savingKwhPerMonth: 45, emoji: '🔥', impact: 'high'   },
      { id: 'kettle_full',  title: 'Boil only what you need',           body: 'A 1500W kettle boiling a full jug uses 3–4× more electricity than a half-full jug. Only boil the amount of water you actually need.',                                             savingKwhPerMonth: 3,  emoji: '☕', impact: 'low'    },
      { id: 'fridge_temp',  title: 'Keep fridge at 3–5°C',             body: "Every degree colder than needed adds ~5% to fridge consumption. Don't set it colder than 3°C — food stays fresh and your units last longer.",                                     savingKwhPerMonth: 5,  emoji: '🧊', impact: 'medium' },
      { id: 'fridge_full',  title: 'Keep your fridge reasonably full',  body: "A full fridge retains cold better than an empty one. If it's nearly empty, fill unused space with sealed bottles of water.",                                                      savingKwhPerMonth: 4,  emoji: '🥤', impact: 'low'    },
    ],
  },
  {
    id: 'lighting', label: 'Lighting', emoji: '💡',
    tips: [
      { id: 'led_switch',    title: 'Replace all bulbs with LEDs',         body: 'A 9W LED gives the same light as a 60W incandescent bulb. Replacing 6 bulbs saves ~300W per hour of use. Payback period is under 2 months in Ghana.',                            savingKwhPerMonth: 15, emoji: '🔆', impact: 'high'   },
      { id: 'daylight',      title: 'Open windows and use daylight',       body: 'Ghana gets 6–8 hours of strong daylight daily. Switching off 4 lights for 6 hours a day saves about 6 kWh a month.',                                                             savingKwhPerMonth: 6,  emoji: '☀️', impact: 'medium' },
      { id: 'security_led',  title: 'Use LED security / flood lights',     body: 'A 100W halogen security light running 10hrs/day costs ~₵60/month. An equivalent 20W LED costs ~₵12/month for the same light output.',                                            savingKwhPerMonth: 24, emoji: '🔦', impact: 'high'   },
    ],
  },
  {
    id: 'devices', label: 'Devices', emoji: '📺',
    tips: [
      { id: 'standby',              title: 'Switch off at the wall, not just remote', body: 'TVs, decoders, and sound systems on standby still draw 5–15W each. Switching off 4 devices at the wall saves ~1 kWh per day — over ₵60/month.',          savingKwhPerMonth: 30, emoji: '🔌', impact: 'high'   },
      { id: 'laptop_over_desktop',  title: 'Use a laptop instead of a desktop',      body: 'A laptop uses 65W vs 200W for a desktop. If you work 8hrs/day, switching to a laptop saves about 40 kWh per month.',                                       savingKwhPerMonth: 40, emoji: '💻', impact: 'high'   },
      { id: 'wifi_off',             title: 'Switch off router at night',              body: 'A router uses 12W 24/7 — about 8 kWh/month. Switching it off for 8 hours at night saves about 3 kWh/month.',                                               savingKwhPerMonth: 3,  emoji: '📶', impact: 'low'    },
    ],
  },
  {
    id: 'water', label: 'Water Pump', emoji: '💧',
    tips: [
      { id: 'pump_timer',    title: 'Pump once a day into a storage tank',  body: 'Running a 370W pump for 1hr once a day uses far less than running it on multiple short bursts. A storage tank lets you pump once and use all day.',        savingKwhPerMonth: 5, emoji: '🪣', impact: 'medium' },
      { id: 'pump_off_peak', title: 'Run your pump at off-peak hours',      body: 'Early morning or late evening (before 7am or after 9pm) often has better grid voltage, meaning the pump works more efficiently and wears out less.',       savingKwhPerMonth: 2, emoji: '🌙', impact: 'low'    },
    ],
  },
  {
    id: 'general', label: 'Habits', emoji: '🏠',
    tips: [
      { id: 'inverter',    title: 'Charge your inverter during the day', body: "If you have an inverter, charge it during the day when solar generation or grid quality is best. Avoid running heavy appliances off the inverter — it's less efficient.", savingKwhPerMonth: 8,  emoji: '🔋', impact: 'medium' },
      { id: 'track_units', title: 'Track your units weekly',             body: 'Knowing how fast your units drop is the first step to controlling it. Use this app to log every top-up and see which appliances cost the most.',                           savingKwhPerMonth: 10, emoji: '📊', impact: 'medium' },
    ],
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function TipsScreen() {
  const insets = useSafeAreaInsets();
  const [expandedTip, setExpandedTip]     = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('cooling');

  const currentCategory =
    TIP_CATEGORIES.find((c) => c.id === activeCategory) ?? TIP_CATEGORIES[0];

  const totalSaving = currentCategory.tips.reduce((s, t) => s + t.savingKwhPerMonth, 0);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={T.background} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <View style={[s.header, { paddingTop: insets.top + 20 }]}>
          <View style={s.headerDots} pointerEvents="none">
            {Array.from({ length: 30 }).map((_, i) => (
              <View key={i} style={s.dot} />
            ))}
          </View>
          <View style={s.headerBadge}>
            <Ionicons name="leaf-outline" size={11} color={T.ring} />
            <Text style={s.headerBadgeText}>Ghana tips</Text>
          </View>
          <Text style={s.headerTitle}>Energy Saving</Text>
          <Text style={s.headerSub}>Stretch your units further</Text>
        </View>

        {/* ── Category pills ──────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.catScroll}
          contentContainerStyle={s.catContent}
        >
          {TIP_CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[s.catPill, active && s.catPillActive]}
                onPress={() => { setActiveCategory(cat.id); setExpandedTip(null); }}
                activeOpacity={0.75}
              >
                <Text style={s.catEmoji}>{cat.emoji}</Text>
                <Text style={[s.catLabel, active && s.catLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Saving banner ───────────────────────────────────────── */}
        <View style={s.savingBanner}>
          <View style={s.savingBannerLeft}>
            <Ionicons name="flash" size={18} color={T.ring} />
            <View>
              <Text style={s.savingBannerLabel}>Apply all tips, save up to</Text>
              <Text style={s.savingBannerAmount}>
                {formatGhs(totalSaving * RATE)}
                <Text style={s.savingBannerSub}> / month</Text>
              </Text>
            </View>
          </View>
          <View style={s.savingKwhBadge}>
            <Text style={s.savingKwhText}>{totalSaving} kWh</Text>
          </View>
        </View>

        {/* ── Tips list ───────────────────────────────────────────── */}
        <View style={s.tipsList}>
          {currentCategory.tips.map((tip) => {
            const expanded = expandedTip === tip.id;
            return (
              <TouchableOpacity
                key={tip.id}
                style={[s.tipCard, expanded && s.tipCardExpanded]}
                onPress={() => setExpandedTip(expanded ? null : tip.id)}
                activeOpacity={0.8}
              >

                {/* Header row */}
                <View style={s.tipHeader}>
                  <View style={[s.tipEmojiWrap, expanded && s.tipEmojiWrapActive]}>
                    <Text style={s.tipEmoji}>{tip.emoji}</Text>
                  </View>

                  <View style={s.tipMeta}>
                    <Text style={[s.tipTitle, expanded && s.tipTitleActive]} numberOfLines={expanded ? undefined : 1}>
                      {tip.title}
                    </Text>
                    <View style={s.tipMetaRow}>
                      <ImpactBadge impact={tip.impact} />
                      <Text style={s.tipSaving}>
                        ~{formatGhs(tip.savingKwhPerMonth * RATE)}/mo
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={T.mutedForeground}
                  />
                </View>

                {/* Body */}
                {expanded && (
                  <View style={s.tipBody}>
                    <Text style={s.tipBodyText}>{tip.body}</Text>
                    <View style={s.tipFooter}>
                      <Ionicons name="flash-outline" size={12} color={T.primaryLight} />
                      <Text style={s.tipFooterText}>
                        {tip.savingKwhPerMonth} kWh saved · {formatGhs(tip.savingKwhPerMonth * RATE)} / month
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </>
  );
}

// ─── ImpactBadge ─────────────────────────────────────────────────────────────
function ImpactBadge({ impact }: { impact: 'high' | 'medium' | 'low' }) {
  const config = {
    high:   { label: 'High impact',   color: T.ring,        bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.2)'   },
    medium: { label: 'Medium impact', color: T.amber,       bg: T.amberDim,               border: 'rgba(245,158,11,0.2)'   },
    low:    { label: 'Low impact',    color: T.mutedForeground, bg: T.secondary,           border: T.border                 },
  }[impact];

  return (
    <View style={[s.impactBadge, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Text style={[s.impactText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatGhs(amount: number): string {
  return `₵${amount.toLocaleString('en-GH', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll:  { flex: 1, backgroundColor: T.background },
  content: { gap: 0 },

  // ── Header
  header: {
    backgroundColor: T.card,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    overflow: 'hidden',
  },
  headerDots: {
    position: 'absolute', top: 0, right: 0,
    width: 160, height: 120,
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 10, opacity: 0.2, padding: 16,
  },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: T.primary },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 9, paddingVertical: 3,
    borderRadius: T.pill, marginBottom: 12,
  },
  headerBadgeText: {
    fontSize: 10, fontWeight: '600', color: T.ring,
    letterSpacing: 0.6, textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 26, fontWeight: '700', color: T.foreground, letterSpacing: -0.5,
  },
  headerSub: { fontSize: 13, color: T.mutedForeground, marginTop: 4 },

  // ── Category scroll
  catScroll:   { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: T.border },
  catContent:  { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 13, paddingVertical: 8,
    borderRadius: T.pill,
    borderWidth: 1, borderColor: T.border,
    backgroundColor: T.secondary,
    marginRight: 4,
  },
  catPillActive: {
    backgroundColor: 'rgba(0,98,57,0.2)',
    borderColor: T.primary,
  },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 13, color: T.mutedForeground, fontWeight: '500' },
  catLabelActive: { color: T.primaryForeground, fontWeight: '600' },

  // ── Saving banner
  savingBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    padding: 14,
    backgroundColor: 'rgba(0,98,57,0.12)',
    borderRadius: T.md,
    borderWidth: 1,
    borderColor: 'rgba(0,168,98,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savingBannerLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1,
  },
  savingBannerLabel: {
    fontSize: 11, color: T.primaryForeground, marginBottom: 2,
  },
  savingBannerAmount: {
    fontSize: 18, fontWeight: '700', color: T.ring,
  },
  savingBannerSub: {
    fontSize: 13, fontWeight: '400', color: T.primaryLight,
  },
  savingKwhBadge: {
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)',
    borderRadius: T.pill,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  savingKwhText: { fontSize: 12, fontWeight: '700', color: T.ring },

  // ── Tips list
  tipsList: { padding: 16, gap: 8 },

  tipCard: {
    backgroundColor: T.secondary,
    borderRadius: T.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    overflow: 'hidden',
  },
  tipCardExpanded: {
    backgroundColor: T.card,
    borderColor: T.border,
  },
  tipAccent: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    width: 3, backgroundColor: T.border,
    borderTopLeftRadius: T.md, borderBottomLeftRadius: T.md,
  },
  tipAccentActive: { backgroundColor: T.primaryLight },

  tipHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  tipEmojiWrap: {
    width: 38, height: 38, borderRadius: T.sm,
    backgroundColor: T.card, borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  tipEmojiWrapActive: {
    borderColor: T.primary,
    backgroundColor: 'rgba(0,98,57,0.15)',
  },
  tipEmoji: { fontSize: 18 },

  tipMeta: { flex: 1, gap: 5 },
  tipTitle: {
    fontSize: 14, fontWeight: '500', color: T.mutedForeground,
  },
  tipTitleActive: { color: T.foreground, fontWeight: '600' },
  tipMetaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  tipSaving: {
    fontSize: 12, fontWeight: '700', color: T.primaryLight,
  },

  impactBadge: {
    borderRadius: T.pill, borderWidth: 1,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  impactText: { fontSize: 10, fontWeight: '600' },

  // Expanded body
  tipBody: {
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: T.border,
    gap: 10,
  },
  tipBodyText: {
    fontSize: 13, color: T.mutedForeground, lineHeight: 21,
  },
  tipFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: T.card, borderRadius: T.sm,
    paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: T.border,
  },
  tipFooterText: {
    fontSize: 12, color: T.primaryLight, fontWeight: '500',
  },
});