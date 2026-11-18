import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { cores, espaco, fonte } from '../tema';

/** Seta de voltar + título grande + subtítulo, como nas telas do design. */
export const Cabecalho = memo(function Cabecalho({ titulo, subtitulo, voltar = true, direita }) {
  const navegacao = useNavigation();
  return (
    <View style={estilos.raiz}>
      {voltar && navegacao.canGoBack() && (
        <Pressable onPress={navegacao.goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Voltar" style={estilos.voltar}>
          <Ionicons name="arrow-back" size={26} color={cores.texto} />
        </Pressable>
      )}
      {titulo || direita ? (
        <View style={estilos.linha}>
          <Text style={[fonte.tituloGrande, estilos.titulo]} accessibilityRole="header">{titulo}</Text>
          {direita}
        </View>
      ) : null}
      {subtitulo ? <Text style={[fonte.corpoSecundario, estilos.subtitulo]}>{subtitulo}</Text> : null}
    </View>
  );
});

const estilos = StyleSheet.create({
  raiz: { paddingTop: espaco.md, gap: espaco.sm, marginBottom: espaco.xs },
  voltar: { alignSelf: 'flex-start', paddingVertical: espaco.sm, marginBottom: espaco.sm },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espaco.md },
  titulo: { flexShrink: 1 },
  subtitulo: { fontSize: 17, lineHeight: 24 },
});
