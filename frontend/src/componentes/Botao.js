import { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { cores, espaco, gradientePrimario, raio } from '../tema';

/**
 * Botão padrão.
 * variante: "primario" (gradiente azul) | "secundario" (fundo azul claro) | "texto" (link) | "perigo"
 */
export const Botao = memo(function Botao({ titulo, aoPressionar, variante = 'primario', carregando = false, desabilitado = false, icone, estilo }) {
  const inativo = desabilitado || carregando;
  const corTexto = { primario: '#FFF', secundario: cores.primariaTexto, texto: cores.primariaTexto, perigo: cores.perigo }[variante];

  const miolo = (
    <View style={estilos.miolo}>
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <>
          {icone && <Ionicons name={icone} size={20} color={corTexto} />}
          <Text style={[estilos.texto, { color: corTexto }, variante === 'texto' && estilos.textoLink]}>{titulo}</Text>
        </>
      )}
    </View>
  );

  return (
    <Pressable
      onPress={aoPressionar}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo, busy: carregando }}
      style={({ pressed }) => [
        estilos.base,
        variante === 'secundario' && estilos.secundario,
        variante === 'perigo' && estilos.perigo,
        variante === 'texto' && estilos.link,
        { opacity: inativo && !carregando ? 0.5 : pressed ? 0.85 : 1 },
        estilo,
      ]}
    >
      {variante === 'primario' ? (
        <LinearGradient colors={gradientePrimario} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={estilos.gradiente}>
          {miolo}
        </LinearGradient>
      ) : miolo}
    </Pressable>
  );
});

const estilos = StyleSheet.create({
  base: { minHeight: 56, borderRadius: raio.pilula, overflow: 'hidden', justifyContent: 'center' },
  gradiente: { flex: 1, minHeight: 56, justifyContent: 'center' },
  secundario: { backgroundColor: cores.primariaSuave },
  perigo: { backgroundColor: cores.perigoSuave },
  link: { minHeight: 44 },
  miolo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espaco.sm, paddingHorizontal: espaco.xl },
  texto: { fontSize: 18, fontWeight: '600' },
  textoLink: { fontSize: 17, fontWeight: '600' },
});
