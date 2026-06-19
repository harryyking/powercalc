/**
 * components/ResultCard.tsx
 */
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CalculationResult } from '../types';
import {
  formatDuration,
  formatGhs,
  formatKwh,
  getUrgencyLevel,
  getUrgencyMessage,
  getTopSavingTip,
  type UrgencyLevel,
} from '../lib/useCalculator';
import { THEME } from '@/lib/theme';

const T = THEME.colors
const S = THEME.radius

// ─── Urgency palette — dark-theme variants ────────────────────────────────────
const URGENCY: Record<UrgencyLevel, {
  bg: string; border: string;
  text: string; accent: string;
  dimBg: string; icon: React.ComponentProps<typeof Ionicons>['name'];
}> = {
  critical: {
    bg:     'rgba(84,28,21,0.25)',
    border: 'rgba(248,113,113,0.3)',
    dimBg:  'rgba(84,28,21,0.15)',
    text:   '#fca5a5',
    accent: '#f87171',
    icon:   'warning-outline',
  },
  warning: {
    bg:     'rgba(120,60,0,0.2)',
    border: 'rgba(245,158,11,0.3)',
    dimBg:  'rgba(120,60,0,0.1)',
    text:   '#fcd34d',
    accent: '#F59E0B',
    icon:   'time-outline',
  },
  good: {
    bg:     'rgba(0,98,57,0.2)',
    border: 'rgba(0,168,98,0.3)',
    dimBg:  'rgba(0,98,57,0.1)',
    text:   '#6ee7b7',
    accent: '#00a862',
    icon:   'checkmark-circle-outline',
  },
  great: {
    bg:     'rgba(30,64,175,0.2)',
    border: 'rgba(96,165,250,0.3)',
    dimBg:  'rgba(30,64,175,0.1)',
    text:   '#93c5fd',
    accent: '#60a5fa',
    icon:   'trophy-outline',
  },
};

interface Props {
  result: CalculationResult;
  compact?: boolean;
  onSave?: () => void;
  onShare?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ResultCard({ result, compact = false, onSave, onShare }: Props) {
  const urgency  = getUrgencyLevel(result.daysLeft);
  const pal      = URGENCY[urgency];
  const duration = formatDuration(result.daysLeft, result.hoursRemainder);
  const tip      = getTopSavingTip(result.breakdown);

  // ── Compact pill ────────────────────────────────────────────────────────────
  if (compact) {
    return (
      <View style={[s.compactCard, { backgroundColor: pal.bg, borderColor: pal.border }]}>
        <View style={[s.compactIconWrap, { backgroundColor: pal.dimBg }]}>
          <Ionicons name={pal.icon} size={16} color={pal.accent} />
        </View>
        <View style={s.compactBody}>
          <Text style={[s.compactDays, { color: pal.text }]}>{duration}</Text>
          <Text style={[s.compactSub, { color: pal.accent }]}>
            {formatGhs(result.dailyCostGhs)}/day · {formatKwh(result.totalKwh)} bought
          </Text>
        </View>
        <View style={[s.urgencyDot, { backgroundColor: pal.accent }]} />
      </View>
    );
  }

  // ── Full card ───────────────────────────────────────────────────────────────
  return (
    <View style={s.container}>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <View style={[s.heroCard, { backgroundColor: pal.bg, borderColor: pal.border }]}>
        {/* Status badge */}
        <View style={[s.heroBadge, { backgroundColor: pal.dimBg, borderColor: pal.border }]}>
          <Ionicons name={pal.icon} size={12} color={pal.accent} />
          <Text style={[s.heroBadgeText, { color: pal.accent }]}>
            {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
          </Text>
        </View>

        <Text style={[s.heroLabel, { color: pal.text }]}>Your credit will last</Text>
        <Text style={[s.heroDuration, { color: pal.text }]}>{duration}</Text>

        {/* Stat chips */}
        <View style={s.statRow}>
          <StatChip label="Credit"      value={formatGhs(result.creditGhs)}           accent={pal.accent} />
          <View style={[s.statDivider, { backgroundColor: pal.border }]} />
          <StatChip label="Units"       value={formatKwh(result.totalKwh)}            accent={pal.accent} />
          <View style={[s.statDivider, { backgroundColor: pal.border }]} />
          <StatChip label="Daily spend" value={`${formatGhs(result.dailyCostGhs)}/d`} accent={pal.accent} />
        </View>

        {result.serviceCharge > 0 && (
          <View style={s.serviceRow}>
            <Ionicons name="flash-outline" size={11} color={pal.accent} />
            <Text style={[s.serviceNote, { color: pal.accent }]}>
              Includes ₵{result.serviceCharge.toFixed(2)} ECG service charge
            </Text>
          </View>
        )}

        <Text style={[s.urgencyMsg, { color: pal.text }]}>
          {getUrgencyMessage(result.daysLeft, result.dailyCostGhs)}
        </Text>
      </View>

    

      {/* ── Saving tip ──────────────────────────────────────────────── */}
      {tip && (
        <View style={s.tipCard}>
          <View style={s.tipIconWrap}>
            <Ionicons name="bulb-outline" size={16} color={T.amber} />
          </View>
          <Text style={s.tipText}>{tip}</Text>
        </View>
      )}

      {/* ── Actions ─────────────────────────────────────────────────── */}
      {(onSave || onShare) && (
        <View style={s.actions}>
    
          {onShare && (
            <TouchableOpacity style={s.btnSecondary} onPress={onShare} activeOpacity={0.8}>
              <Ionicons name="share-outline" size={15} color={T.primaryLight} />
              <Text style={s.btnSecondaryText}>Share</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ─── StatChip ─────────────────────────────────────────────────────────────────
function StatChip({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={s.chip}>
      <Text style={[s.chipLabel, { color: accent, opacity: 0.75 }]}>{label}</Text>
      <Text style={[s.chipValue, { color: accent }]}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { gap: 10 },

  // ── Hero card
  heroCard: {
    borderRadius: S.lg,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: S.pill,
    borderWidth: 1,
    marginBottom: 4,
  },
  heroBadgeText: {
    fontSize: 10, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  heroLabel: {
    fontSize: 12, fontWeight: '500',
    textTransform: 'uppercase', letterSpacing: 0.8,
    opacity: 0.8,
  },
  heroDuration: {
    fontSize: 44, fontWeight: '800',
    letterSpacing: -1.5, lineHeight: 48,
  },

  // Stat row
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: S.md,
    paddingVertical: 10,
    marginVertical: 2,
  },
  chip: { flex: 1, alignItems: 'center', gap: 2 },
  chipLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipValue: { fontSize: 13, fontWeight: '700' },
  statDivider: { width: 1, height: 28 },

  serviceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  serviceNote: { fontSize: 11, opacity: 0.8 },
  urgencyMsg: { fontSize: 13, lineHeight: 19, opacity: 0.9 },

  // ── Breakdown card
  breakdownCard: {
    backgroundColor: T.secondary,
    borderRadius: S.lg,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: T.foreground,
  },
  sectionSub: {
    fontSize: 12, color: T.mutedForeground,
  },
  breakdownRow: {
    paddingHorizontal: 16, paddingVertical: 12, gap: 8,
  },
  breakdownRowBorder: {
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  breakdownTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  breakdownLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1,
  },
  breakdownEmoji: { fontSize: 18 },
  breakdownName: {
    fontSize: 13, fontWeight: '500', color: T.foreground,
  },
  whatIf: {
    fontSize: 11, color: T.primaryLight, marginTop: 2,
  },
  breakdownRight: {
    flexDirection: 'row', alignItems: 'baseline', gap: 2,
  },
  breakdownCost: {
    fontSize: 15, fontWeight: '700', color: T.primaryLight,
  },
  breakdownCostSub: {
    fontSize: 11, color: T.mutedForeground,
  },
  barTrack: {
    height: 5,
    backgroundColor: T.border,
    borderRadius: S.pill,
    overflow: 'hidden',
  },
  barFill: {
    height: 5, borderRadius: S.pill,
  },
  barPct: {
    fontSize: 10, color: T.mutedForeground, textAlign: 'right',
  },

  // ── Tip card
  tipCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(120,60,0,0.15)',
    borderRadius: S.md,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    padding: 14,
    alignItems: 'flex-start',
  },
  tipIconWrap: {
    width: 30, height: 30,
    borderRadius: S.sm,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  tipText: {
    flex: 1, fontSize: 13,
    color: '#fcd34d', lineHeight: 19,
  },

  // ── Actions
  actions: { flexDirection: 'row', gap: 8 },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: T.secondary,
    borderRadius: S.md,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 13,
  },
  btnPrimaryText: {
    color: T.foreground, fontSize: 14, fontWeight: '600',
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(0,98,57,0.1)',
    borderRadius: S.md,
    borderWidth: 1,
    borderColor: 'rgba(0,168,98,0.25)',
    paddingVertical: 13,
  },
  btnSecondaryText: {
    color: T.primaryLight, fontSize: 14, fontWeight: '600',
  },

  // ── Compact
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: S.md,
    borderWidth: 1,
    padding: 12,
  },
  compactIconWrap: {
    width: 32, height: 32, borderRadius: S.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  compactBody: { flex: 1 },
  compactDays: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  compactSub:  { fontSize: 12, marginTop: 2 },
  urgencyDot:  { width: 8, height: 8, borderRadius: 4 },
});