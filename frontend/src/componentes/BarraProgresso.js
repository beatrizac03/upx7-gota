import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { cores, raio } from '../tema';

/** Barra de progresso (ex.: consumo de hoje em relação à meta). */
export const BarraProgresso = memo(function BarraProgresso({ percentual, altura = 10 }) {
  const valor = Math.max(0, Math.min(100, percentual));
  const cor = percentual > 100 ? cores.perigo : percentual > 85 ? '#F2A33A' : cores.primariaClara;
  return (
    <View style={[estilos.trilho, { height: altura }]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(valor) }}>
      <View style={[estilos.preenchimento, { width: `${valor}%`, backgroundColor: cor }]} />
    </View>
  );
});

const estilos = StyleSheet.create({
  trilho: { backgroundColor: cores.campo, borderRadius: raio.pilula, overflow: 'hidden' },
  preenchimento: { height: '100%', borderRadius: raio.pilula },
});
