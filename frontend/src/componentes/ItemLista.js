import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { cores, espaco } from '../tema';

/** Linha de lista com ícone, rótulo, valor e seta (tela Perfil / Mais). */
export const ItemLista = memo(function ItemLista({ icone, familia = 'ion', corIcone = cores.texto, rotulo, valor, aoPressionar, ultimo = false, destrutivo = false }) {
  const Familia = familia === 'mci' ? MaterialCommunityIcons : Ionicons;
  return (
    <Pressable
      onPress={aoPressionar}
      disabled={!aoPressionar}
      accessibilityRole="button"
      accessibilityLabel={valor ? `${rotulo}: ${valor}` : rotulo}
      style={({ pressed }) => [estilos.linha, !ultimo && estilos.divisor, pressed && { opacity: 0.6 }]}
    >
      <Familia name={icone} size={26} color={destrutivo ? cores.perigo : corIcone} />
      <Text style={[estilos.rotulo, destrutivo && { color: cores.perigo }]} numberOfLines={1}>{rotulo}</Text>
      {valor !== undefined && <Text style={estilos.valor} numberOfLines={1}>{valor}</Text>}
      {aoPressionar && !destrutivo && <Ionicons name="chevron-forward" size={22} color={cores.textoSecundario} />}
    </Pressable>
  );
});

/** Agrupa itens em um cartão com título de seção. */
export function GrupoLista({ titulo, children }) {
  return (
    <View style={estilos.grupo}>
      {titulo ? <Text style={estilos.tituloGrupo}>{titulo}</Text> : null}
      <View style={estilos.cartao}>{children}</View>
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.lg, paddingVertical: espaco.lg + 2, paddingHorizontal: espaco.xl },
  divisor: { borderBottomWidth: 1, borderBottomColor: cores.borda },
  rotulo: { flex: 1, fontSize: 17, color: cores.texto },
  valor: { fontSize: 17, color: cores.textoSecundario, maxWidth: '45%' },
  grupo: { gap: espaco.md },
  tituloGrupo: { fontSize: 22, fontWeight: '700', color: cores.texto },
  cartao: { backgroundColor: cores.superficie, borderRadius: 20, borderWidth: 1, borderColor: cores.borda, overflow: 'hidden' },
});
