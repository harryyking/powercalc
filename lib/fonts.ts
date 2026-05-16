/**
 * constants/fonts.ts
 *
 * SF Pro Rounded is pre-installed on every iPhone running iOS 13+.
 * We reference it by its PostScript name — no expo-font loading needed.
 *
 * On Android, 'sans-serif-rounded' maps to the Roboto rounded variant
 * which ships on all Android devices.
 *
 * Usage:
 *   import { Fonts } from '@/constants/fonts';
 *   <Text style={{ fontFamily: Fonts.regular }}>Hello</Text>
 *
 *   // Or just use the <Text> component from @/components/Text
 *   // which applies the right weight automatically.
 */

import { Platform } from 'react-native';

const ios = Platform.OS === 'ios';

export const Fonts = {
  thin:       ios ? 'SFProRounded-Ultralight' : 'sans-serif-thin',
  light:      ios ? 'SFProRounded-Light'      : 'sans-serif-light',
  regular:    ios ? 'SFProRounded-Regular'    : 'sans-serif',
  medium:     ios ? 'SFProRounded-Medium'     : 'sans-serif-medium',
  semibold:   ios ? 'SFProRounded-Semibold'   : 'sans-serif-medium',
  bold:       ios ? 'SFProRounded-Bold'       : 'sans-serif',        // fontWeight:'700'
  heavy:      ios ? 'SFProRounded-Heavy'      : 'sans-serif',        // fontWeight:'800'
  black:      ios ? 'SFProRounded-Black'      : 'sans-serif',        // fontWeight:'900'
};

/**
 * Map a fontWeight value to the correct SF Pro Rounded PostScript name.
 * Use this when you have existing StyleSheets that set fontWeight numerically
 * and you want to migrate them without rewriting every style.
 *
 * Example:
 *   fontFamily: weightToFont('700')  →  'SFProRounded-Bold' on iOS
 */
export function weightToFont(weight: string | number = '400'): string {
  const w = String(weight);
  const map: Record<string, string> = {
    '100': Fonts.thin,
    '200': Fonts.thin,
    '300': Fonts.light,
    '400': Fonts.regular,
    '500': Fonts.medium,
    '600': Fonts.semibold,
    '700': Fonts.bold,
    '800': Fonts.heavy,
    '900': Fonts.black,
    normal: Fonts.regular,
    bold:   Fonts.bold,
  };
  return map[w] ?? Fonts.regular;
}