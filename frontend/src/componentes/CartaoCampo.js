import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cores, espaco, raio } from '../tema';

/** Cartão de formulário com ícone à esquerda e controle à direita (tela "Sua residência"). */
export const CartaoCampo = memo(function CartaoCampo({ icone, rotulo, children }) {
  return (
    <View style={estilos.cartao}>
      <Ionicons name={icone} size={36} color={cores.texto} style={estilos.icone} />
      <View style={estilos.corpo}>
        <Text style={estilos.rotulo}>{rotulo}</Text>
        {children}
      </View>
    </View>
  );
});

/** Caixa azul clara com ícone de informação. */
export const AvisoInfo = memo(function AvisoInfo({ texto, icone = 'information-circle' }) {
  return (
    <View style={estilos.info}>
      <Ionicons name={icone} size={32} color={cores.primariaClara} />
      <Text style={estilos.textoInfo}>{texto}</Text>
    </View>
  );
});

const estilos = StyleSheet.create({
  cartao: { flexDirection: 'row', alignItems: 'center', gap: espaco.lg, padding: espaco.xl, backgroundColor: cores.superficie, borderRadius: raio.lg, borderWidth: 1, borderColor: cores.borda },
  icone: { width: 44 },
  corpo: { flex: 1, gap: espaco.md },
  rotulo: { fontSize: 16, color: cores.texto },
  info: { flexDirection: 'row', alignItems: 'center', gap: espaco.lg, padding: espaco.xl, backgroundColor: '#F1F6FC', borderRadius: raio.lg },
  textoInfo: { flex: 1, fontSize: 15, lineHeight: 22, color: cores.textoSecundario },
});
