import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cores, raio } from '../tema';

/** Alternador "Consumo | Custo (R$)", "Personalizadas | Todas", "Casa | Apartamento"... */
export const OpcoesSegmentadas = memo(function OpcoesSegmentadas({ opcoes, valor, aoMudar, compacto = false }) {
  return (
    <View style={[estilos.trilho, compacto && estilos.trilhoCompacto]} accessibilityRole="tablist">
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === valor;
        return (
          <Pressable
            key={String(opcao.valor)}
            onPress={() => aoMudar(opcao.valor)}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativo }}
            style={[estilos.opcao, compacto && estilos.opcaoCompacta, ativo && estilos.ativo]}
          >
            <Text style={[estilos.texto, ativo && estilos.textoAtivo]} numberOfLines={1}>{opcao.rotulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
});

const estilos = StyleSheet.create({
  trilho: { flexDirection: 'row', backgroundColor: '#EEF1F5', borderRadius: raio.pilula, padding: 0 },
  trilhoCompacto: { padding: 3 },
  opcao: { flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: raio.pilula, borderWidth: 1.5, borderColor: 'transparent', paddingHorizontal: 8 },
  opcaoCompacta: { minHeight: 42 },
  ativo: { backgroundColor: cores.superficie, borderColor: cores.primariaClara },
  texto: { fontSize: 16, fontWeight: '500', color: cores.textoSecundario },
  textoAtivo: { color: cores.primariaTexto, fontWeight: '600' },
});
