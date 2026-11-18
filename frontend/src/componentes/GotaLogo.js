import { memo, useId } from 'react';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

/** Gota da marca (SVG vetorial, nítida em qualquer tamanho). */
export const GotaLogo = memo(function GotaLogo({ tamanho = 120 }) {
  // id único por instância: telas empilhadas não podem compartilhar o mesmo gradiente
  const idGradiente = `gota${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg width={tamanho} height={tamanho * 1.15} viewBox="0 0 100 115" accessibilityLabel="Logotipo Gota">
      <Defs>
        <LinearGradient id={idGradiente} x1="0" y1="0" x2="0.4" y2="1">
          <Stop offset="0" stopColor="#7CC3F5" />
          <Stop offset="1" stopColor="#4FA3E3" />
        </LinearGradient>
      </Defs>
      <Path d="M50 4 C50 4 12 52 12 76 a38 38 0 0 0 76 0 C88 52 50 4 50 4 Z" fill={`url(#${idGradiente})`} />
      <Path d="M70 84 q-4 12 -16 16" stroke="#FFFFFF" strokeOpacity={0.75} strokeWidth={4} strokeLinecap="round" fill="none" />
    </Svg>
  );
});
