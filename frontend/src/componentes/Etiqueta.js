import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cores, espaco, raio } from '../tema';

const TONS = {
  sucesso: { fundo: cores.sucessoSuave, texto: cores.sucesso },
  perigo: { fundo: cores.perigoSuave, texto: cores.perigo },
  aviso: { fundo: cores.avisoSuave, texto: cores.aviso },
  info: { fundo: cores.primariaSuave, texto: cores.primariaTexto },
  neutro: { fundo: cores.campo, texto: cores.textoSecundario },
};

/** Pílula colorida (ex.: "-12%", "R$ 14,20", "Conectado"). */
export const Etiqueta = memo(function Etiqueta({ texto, tom = 'neutro', icone, grande = false }) {
  const cor = TONS[tom];
  return (
    <View style={[estilos.base, { backgroundColor: cor.fundo }, grande && estilos.grande]}>
      {icone && <Ionicons name={icone} size={grande ? 18 : 14} color={cor.texto} />}
      <Text style={[estilos.texto, { color: cor.texto }, grande && estilos.textoGrande]}>{texto}</Text>
    </View>
  );
});

const estilos = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: espaco.md, paddingVertical: 6, borderRadius: raio.pilula },
  grande: { paddingHorizontal: espaco.lg, paddingVertical: espaco.sm },
  texto: { fontSize: 14, fontWeight: '700' },
  textoGrande: { fontSize: 20, fontWeight: '800' },
});
