/**
 * components/Text.tsx
 *
 * Drop-in replacement for React Native's Text.
 * Automatically applies SF Pro Rounded (iOS) / Roboto Rounded (Android)
 * by mapping the fontWeight you already write to the correct PostScript
 * font family name — so none of your existing style props change.
 *
 * Usage — swap the import, nothing else changes:
 *   - import { Text } from 'react-native';          ← remove
 *   + import { Text } from '@/components/Text';     ← add
 *
 * All standard Text props (style, numberOfLines, onPress, etc.) pass
 * straight through to the native Text element.
 */

import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { weightToFont } from '@/lib/fonts';

export function Text({ style, ...props }: TextProps) {
  // Flatten whatever style(s) the caller passed so we can read fontWeight
  const flat = StyleSheet.flatten(style) ?? {};

  // Pick the right rounded font family for this weight.
  // If the caller already set fontFamily explicitly we respect it.
  const fontFamily = flat.fontFamily ?? weightToFont(flat.fontWeight);

  // On iOS, once fontFamily is set to a specific PostScript name the
  // fontWeight prop is redundant (the weight is baked into the name).
  // We keep it in the style anyway — it's harmless and avoids breaking
  // any snapshot tests or style inspection tools.
  return (
    <RNText
      {...props}
      style={[style, { fontFamily }]}
    />
  );
}

export default Text;