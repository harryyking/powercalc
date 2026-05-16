/**
 * app/index.tsx — Onboarding Screen
 *
 * Shows once. After completing, sets AsyncStorage key and routes to tabs.
 * iOS dark-mode aesthetic: large typography, glow orbs, spring animations,
 * page dots, swipeable FlatList.
 *
 * Requires: @react-native-async-storage/async-storage
 *   npm i @react-native-async-storage/async-storage
 */

import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Text   from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:           '#0a0a0a',
  surface:      '#111111',
  card:         '#161616',
  border:       '#1f1f1f',
  fore:         '#f0f0f0',
  sub:          '#888888',
  dim:          '#444444',
  green:        '#1DB954',   // Slightly richer green, iOS feel
  greenGlow:    'rgba(29,185,84,0.18)',
  greenBorder:  'rgba(29,185,84,0.25)',
  amber:        '#FF9F0A',   // iOS system amber
  amberGlow:    'rgba(255,159,10,0.15)',
  blue:         '#0A84FF',   // iOS system blue
  blueGlow:     'rgba(10,132,255,0.15)',
  pill:         999,
};

// ─── Slides data ──────────────────────────────────────────────────────────────
const SLIDES = [
  {
    key: 'know',
    accentColor: T.green,
    glowColor:   T.greenGlow,
    icon:        'flash' as const,
    eyebrow:     'Electricity, simplified',
    title:       'Know exactly how long your credit lasts',
    body:        'Enter your ECG prepaid amount and get a precise estimate — no more surprise outages.',
    // Visual: stacked credit cards
    visual:      'credit',
  },
  {
    key: 'appliances',
    accentColor: T.amber,
    glowColor:   T.amberGlow,
    icon:        'bulb' as const,
    eyebrow:     'Every watt counted',
    title:       'See what each appliance actually costs',
    body:        'Pick your fridge, fan, TV and more. Adjust hours and get a real daily cost for each.',
    visual:      'appliances',
  },
  {
    key: 'history',
    accentColor: T.blue,
    glowColor:   T.blueGlow,
    icon:        'bar-chart' as const,
    eyebrow:     'Track your usage',
    title:       'Save estimates and spot patterns',
    body:        'Log each calculation to your history and buy the right amount of credit every time.',
    visual:      'history',
  },
] as const;

// ─── Slide visuals ────────────────────────────────────────────────────────────

function CreditVisual({ color }: { color: string }) {
  return (
    <View style={vis.root}>
      {/* Glow orb behind */}
      <View style={[vis.orb, { backgroundColor: `rgba(29,185,84,0.12)` }]} />
      {/* Stacked cards */}
      {[{ rotate: '-6deg', top: 8, opacity: 0.35 }, { rotate: '3deg', top: 4, opacity: 0.6 }, { rotate: '0deg', top: 0, opacity: 1 }].map((card, i) => (
        <View
          key={i}
          style={[
            vis.card,
            {
              transform: [{ rotate: card.rotate }],
              marginTop: i === 0 ? 0 : -72,
              opacity: card.opacity,
              zIndex: i,
            },
          ]}
        >
          {i === 2 && (
            <>
              <View style={vis.cardChip} />
              <Text style={[vis.cardAmount, { color }]}>₵ 50.00</Text>
              <Text style={vis.cardLabel}>ECG Prepaid Credit</Text>
              <View style={vis.cardBarRow}>
                {[70, 45, 60, 30, 80, 50].map((h, j) => (
                  <View key={j} style={[vis.cardBar, { height: h * 0.28, backgroundColor: color + '55' }]} />
                ))}
              </View>
            </>
          )}
        </View>
      ))}
      {/* Days badge */}
      <View style={[vis.badge, { borderColor: color + '40', backgroundColor: color + '15' }]}>
        <Ionicons name="time-outline" size={13} color={color} />
        <Text style={[vis.badgeText, { color }]}>~8 days remaining</Text>
      </View>
    </View>
  );
}

function AppliancesVisual({ color }: { color: string }) {
const items = [
  { 
    icon: 'bulb-outline' as const,   
    label: 'Bulbs',   
    cost: '₵0.12', 
    w: 60 
  },
  { 
    icon: 'tv-outline' as const,     
    label: 'TV',      
    cost: '₵0.38', 
    w: 85 
  },
  { 
    icon: 'snow-outline' as const,   
    label: 'Fridge',  
    cost: '₵1.20', 
    w: 100 
  },
  { 
    icon: 'cloud' as const,            // ← Fixed
    label: 'Fan',     
    cost: '₵0.22', 
    w: 45 
  },
];
  return (
    <View style={vis.root}>
      <View style={[vis.orb, { backgroundColor: `rgba(255,159,10,0.10)` }]} />
      <View style={vis.listCard}>
        <Text style={vis.listTitle}>Daily appliance cost</Text>
        {items.map((item) => (
          <View key={item.label} style={vis.listRow}>
            <View style={[vis.listIcon, { backgroundColor: color + '18', borderColor: color + '30' }]}>
              <Ionicons name={item.icon} size={14} color={color} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={vis.listLabel}>{item.label}</Text>
                <Text style={[vis.listCost, { color }]}>{item.cost}</Text>
              </View>
              <View style={vis.barBg}>
                <View style={[vis.barFill, { width: `${item.w}%` as any, backgroundColor: color }]} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function HistoryVisual({ color }: { color: string }) {
  const entries = [
    { date: 'Today',      credit: '₵50',  days: '8 days' },
    { date: 'Jun 2',      credit: '₵100', days: '15 days' },
    { date: 'May 18',     credit: '₵50',  days: '7 days' },
  ];
  return (
    <View style={vis.root}>
      <View style={[vis.orb, { backgroundColor: `rgba(10,132,255,0.10)` }]} />
      <View style={vis.listCard}>
        <Text style={vis.listTitle}>Saved history</Text>
        {entries.map((e, i) => (
          <View key={i} style={[vis.historyRow, i < entries.length - 1 && vis.historyRowBorder]}>
            <View style={[vis.historyDot, { backgroundColor: color }]} />
            <View style={{ flex: 1 }}>
              <Text style={vis.historyDate}>{e.date}</Text>
              <Text style={vis.historyMeta}>{e.credit} purchased</Text>
            </View>
            <View style={[vis.historyChip, { backgroundColor: color + '18', borderColor: color + '30' }]}>
              <Text style={[vis.historyChipText, { color }]}>{e.days}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Page dot ─────────────────────────────────────────────────────────────────
function Dot({ active, color }: { active: boolean; color: string }) {
  return (
    <View
      style={[
        s.dot,
        {
          width: active ? 20 : 6,
          backgroundColor: active ? color : T.dim,
        },
      ]}
    />
  );
}

// ─── Slide item ───────────────────────────────────────────────────────────────
function Slide({ item }: { item: (typeof SLIDES)[number] }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.slide, { width: SW }]}>
      {/* Visual area */}
      <Animated.View entering={FadeIn.duration(500)} style={s.visualArea}>
        {item.visual === 'credit'     && <CreditVisual     color={item.accentColor} />}
        {item.visual === 'appliances' && <AppliancesVisual color={item.accentColor} />}
        {item.visual === 'history'    && <HistoryVisual    color={item.accentColor} />}
      </Animated.View>

      {/* Text */}
      <Animated.View entering={FadeInUp.delay(120).duration(450)} style={s.textBlock}>
        <View style={[s.eyebrowBadge, { backgroundColor: item.accentColor + '18', borderColor: item.accentColor + '35' }]}>
          <Ionicons name={item.icon} size={11} color={item.accentColor} />
          <Text style={[s.eyebrow, { color: item.accentColor }]}>{item.eyebrow}</Text>
        </View>
        <Text style={s.slideTitle}>{item.title}</Text>
        <Text style={s.slideBody}>{item.body}</Text>
      </Animated.View>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const ONBOARDING_KEY = '@powercalc_onboarding_done';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const flatRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  const current = SLIDES[index];
  const isLast  = index === SLIDES.length - 1;

  const onViewableChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setIndex(viewableItems[0].index);
      }
    },
  ).current;

  const next = () => {
    if (!isLast) {
      flatRef.current?.scrollToIndex({ index: index + 1, animated: true });
    }
  };

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)');
  };

  const skip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)');
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <View style={[s.root, { backgroundColor: T.bg }]}>

        {/* Skip — top right */}
        {!isLast && (
          <Animated.View
            entering={FadeIn}
            style={[s.skipWrap, { top: insets.top + 16 }]}
          >
            <TouchableOpacity onPress={skip} hitSlop={12} style={s.skipBtn}>
              <Text style={s.skipText}>Skip</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Slides */}
        <FlatList
          ref={flatRef}
          data={SLIDES as any}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onViewableItemsChanged={onViewableChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          renderItem={({ item }) => <Slide item={item as any} />}
        />

        {/* Bottom controls */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={[s.bottom, { paddingBottom: insets.bottom + 20 }]}
        >
          {/* Page dots */}
          <View style={s.dots}>
            {SLIDES.map((slide, i) => (
              <Dot key={slide.key} active={i === index} color={current.accentColor} />
            ))}
          </View>

          {/* CTA button */}
          {isLast ? (
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: current.accentColor }]}
              onPress={finish}
              activeOpacity={0.85}
            >
              <Ionicons name="flash" size={17} color="#fff" />
              <Text style={s.primaryBtnText}>Start Calculating</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: current.accentColor }]}
              onPress={next}
              activeOpacity={0.85}
            >
              <Text style={s.primaryBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </>
  );
}

// ─── Visual sub-styles ────────────────────────────────────────────────────────
const vis = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  orb: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    alignSelf: 'center',
  },
  card: {
    width: SW * 0.72,
    height: 160,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  cardChip: {
    width: 28,
    height: 20,
    borderRadius: 5,
    backgroundColor: '#2e2e2e',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  cardAmount: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  cardLabel: {
    fontSize: 10,
    color: '#555',
    fontWeight: '500',
  },
  cardBarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  cardBar: {
    width: 6,
    borderRadius: 3,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listCard: {
    width: SW * 0.72,
    backgroundColor: '#161616',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#222',
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  listTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  listIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ccc',
  },
  listCost: {
    fontSize: 12,
    fontWeight: '700',
  },
  barBg: {
    height: 3,
    backgroundColor: '#222',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: 3,
    borderRadius: 2,
    opacity: 0.75,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  historyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ddd',
  },
  historyMeta: {
    fontSize: 11,
    color: '#555',
    marginTop: 1,
  },
  historyChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  historyChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

// ─── Main styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  skipWrap: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  skipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 32,
  },
  visualArea: {
    width: '100%',
    height: SH * 0.36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    width: '100%',
    gap: 14,
  },
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  slideTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#f0f0f0',
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  slideBody: {
    fontSize: 15,
    color: '#888',
    lineHeight: 23,
    fontWeight: '400',
  },
  bottom: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 20,
    backgroundColor: T.bg,
    borderTopWidth: 1,
    borderTopColor: '#161616',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    transform: [{ scaleX: 0.3 }],
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 17,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
});