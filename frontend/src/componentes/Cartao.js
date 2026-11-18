import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cores, espaco, raio, sombra } from '../tema';

/** Cartão branco arredondado. Se receber aoPressionar, vira botão. */
export const Cartao = memo(function Cartao({ children, titulo, aoPressionar, estilo, tom = 'superficie', acessibilidade }) {
  const fundo = { superficie: cores.superficie, sucesso: cores.sucessoSuave, perigo: cores.perigoSuave, info: cores.primariaSuave }[tom];
  const conteudo = (
    <>
      {titulo ? <Text style={estilos.titulo}>{titulo}</Text> : null}
      {children}
    </>
  );
  if (aoPressionar) {
    return (
      <Pressable
        onPress={aoPressionar}
        accessibilityRole="button"
        accessibilityLabel={acessibilidade}
        style={({ pressed }) => [estilos.base, { backgroundColor: fundo }, tom !== 'superficie' && estilos.semBorda, pressed && estilos.pressionado, estilo]}
      >
        {conteudo}
      </Pressable>
    );
  }
  return <View style={[estilos.base, { backgroundColor: fundo }, tom !== 'superficie' && estilos.semBorda, estilo]}>{conteudo}</View>;
});

const estilos = StyleSheet.create({
  base: { borderRadius: raio.lg, padding: espaco.xl, gap: espaco.md, borderWidth: 1, borderColor: cores.borda, ...sombra },
  semBorda: { borderColor: 'transparent', shadowOpacity: 0, elevation: 0 },
  titulo: { fontSize: 19, fontWeight: '700', color: cores.texto },
  pressionado: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
