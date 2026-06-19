/**
 * components/ApplianceCard.tsx
 *
 * Compact 2-column tile. No inline expansion.
 *
 * Tap behaviour:
 *   – Inactive card  → add to active list + open edit sheet
 *   – Active card    → open edit sheet (re-configure)
 *   – Toggle circle  → always toggles on/off (quick remove when active)
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ActiveAppliance, Appliance } from '../types';
import { formatGhs } from '../lib/useCalculator';
import { THEME } from '@/lib/theme';

const T = THEME.colors;
const S = THEME.radius;

interface Props {
  appliance: Appliance;
  activeAppliance?: ActiveAppliance;
  effectiveRatePerKwh: number;
  /** Toggle-circle press — always adds or removes */
  onToggle: (appliance: Appliance) => void;
  /** Card-body press — add-if-needed then open the edit sheet */
  onCardPress: (appliance: Appliance) => void;
}

export default function ApplianceCard({
  appliance,
  activeAppliance,
  effectiveRatePerKwh,
  onToggle,
  onCardPress,
}: Props) {
  const isActive = !!activeAppliance;
  const hours    = activeAppliance?.hoursPerDay ?? appliance.defaultHoursPerDay;
  const quantity = activeAppliance?.quantity    ?? 1;
  const watts    = activeAppliance?.watts       ?? appliance.defaultWatts;

  const dailyKwh  = (watts * quantity * hours) / 1000;
  const dailyCost = dailyKwh * effectiveRatePerKwh;

  return (
    <TouchableOpacity
      style={[s.card, isActive && s.cardActive]}
      onPress={() => onCardPress(appliance)}
      activeOpacity={0.72}
    >
      <View style={s.row}>

        {/* Emoji ───────────────────────────────────────────────── */}
        <View style={[s.emojiWrap, isActive && s.emojiWrapActive]}>
          <Text style={s.emoji}>{appliance.emoji}</Text>
        </View>

        {/* Name + sub-label ─────────────────────────────────────── */}
        <View style={s.info}>
          <Text
            style={[s.name, isActive && s.nameActive]}
            numberOfLines={2}
          >
            {appliance.name}
          </Text>

          {isActive ? (
            <View style={s.costBadge}>
              <Text style={s.costText}>{formatGhs(dailyCost)}</Text>
              <Text style={s.costSub}> /day</Text>
            </View>
          ) : (
            <Text style={s.wattsLabel}>{watts}W</Text>
          )}
        </View>

        {/* Toggle circle ────────────────────────────────────────── */}
        <TouchableOpacity
          style={[s.toggleCircle, isActive && s.toggleCircleActive]}
          onPress={() => onToggle(appliance)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[s.toggleIcon, isActive && s.toggleIconActive]}>
            {isActive ? '✓' : '+'}
          </Text>
        </TouchableOpacity>

      </View>

      {/* "Tap to configure" hint — only on active cards ───────── */}
      {isActive && (
        <View style={s.editHint}>
          <Text style={s.editHintText}>Tap to configure ›</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  card: {
    // Explicit 48% keeps the 2-col grid even when parent uses flexWrap
    width: '100%',
    backgroundColor: T.secondary,
    borderRadius: S.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: 12,
    overflow: 'hidden',
    gap: 6,
    marginBottom: 8
  },
  cardActive: {
    backgroundColor: T.card,
    borderColor: T.primaryLight,
    // Subtle glow on the border
    shadowColor: T.ring,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Emoji
  emojiWrap: {
    width: 34,
    height: 34,
    borderRadius: S.sm,
    backgroundColor: T.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: T.border,
    flexShrink: 0,
  },
  emojiWrapActive: {
    borderColor: T.primary,
    backgroundColor: 'rgba(0, 98, 57, 0.15)',
  },
  emoji: {
    fontSize: 18,
  },

  // Info column
  info: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  name: {
    fontSize: 12,
    fontWeight: '500',
    color: T.mutedForeground,
    lineHeight: 16,
  },
  nameActive: {
    color: T.foreground,
    fontWeight: '600',
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 98, 57, 0.2)',
    borderRadius: S.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: T.primary,
  },
  costText: {
    fontSize: 10,
    fontWeight: '700',
    color: T.ring,
  },
  costSub: {
    fontSize: 9,
    color: T.primaryLight,
  },
  wattsLabel: {
    fontSize: 10,
    color: T.mutedForeground,
    opacity: 0.65,
  },

  // Toggle
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.card,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  toggleCircleActive: {
    backgroundColor: T.primary,
    borderColor: T.primaryLight,
  },
  toggleIcon: {
    fontSize: 12,
    color: T.mutedForeground,
    lineHeight: 14,
  },
  toggleIconActive: {
    color: T.primaryForeground,
    fontWeight: '700',
  },

  // Edit hint strip at bottom of active card
  editHint: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,98,57,0.2)',
    paddingTop: 5,
  },
  editHintText: {
    fontSize: 9,
    color: T.primaryLight,
    fontWeight: '500',
    textAlign: 'right',
    opacity: 0.8,
  },
});