import type { CSSProperties } from 'react';

/** Inline knob position only while the snap animation runs; idle layout uses CSS (is-fantasy / insets). */
export function liquidSolidToggleKnobStyle(
  toggleAnimating: boolean,
  toggleKnobLeftEffectivePx: number | null | undefined
): CSSProperties | undefined {
  if (!toggleAnimating || toggleKnobLeftEffectivePx == null) return undefined;
  return { ['--toggle-knob-left' as string]: `${toggleKnobLeftEffectivePx}px` };
}
