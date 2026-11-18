import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { cores, espaco } from '../tema';

/** Indicador de progresso do cadastro inicial ("Passo 2 de 3"). */
export const Passos = memo(function Passos({ atual, total }) {
  return (
    <View style={estilos.raiz} accessibilityLabel={`Passo ${atual} de ${total}`}>
      <View style={estilos.trilho}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[estilos.segmento, i < atual && estilos.feito]} />
        ))}
      </View>
      <Text style={estilos.texto}>Passo {atual} de {total}</Text>
    </View>
  );
});

const estilos = StyleSheet.create({
  raiz: { gap: espaco.sm, marginTop: espaco.md },
  trilho: { flexDirection: 'row', gap: 6 },
  segmento: { flex: 1, height: 5, borderRadius: 3, backgroundColor: cores.borda },
  feito: { backgroundColor: cores.primariaClara },
  texto: { fontSize: 13, color: cores.textoSecundario, fontWeight: '600' },
});
