import { memo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Botao } from './Botao';
import { cores, espaco, fonte } from '../tema';

export const Carregando = memo(function Carregando({ texto }) {
  return (
    <View style={estilos.centro} accessibilityLabel="Carregando">
      <ActivityIndicator size="large" color={cores.primaria} />
      {texto ? <Text style={fonte.legenda}>{texto}</Text> : null}
    </View>
  );
});

export const EstadoErro = memo(function EstadoErro({ erro, aoTentarNovamente }) {
  return (
    <View style={estilos.centro}>
      <Ionicons name="cloud-offline-outline" size={48} color={cores.textoTerciario} />
      <Text style={[fonte.subtitulo, estilos.textoCentro]}>Não foi possível carregar</Text>
      <Text style={[fonte.corpoSecundario, estilos.textoCentro]}>{erro?.message ?? 'Tente novamente em instantes.'}</Text>
      {aoTentarNovamente && <Botao titulo="Tentar novamente" variante="secundario" aoPressionar={aoTentarNovamente} estilo={estilos.botao} />}
    </View>
  );
});

export const EstadoVazio = memo(function EstadoVazio({ icone = 'water-outline', titulo, texto, children }) {
  return (
    <View style={estilos.centro}>
      <Ionicons name={icone} size={48} color={cores.primariaClara} />
      <Text style={[fonte.subtitulo, estilos.textoCentro]}>{titulo}</Text>
      {texto ? <Text style={[fonte.corpoSecundario, estilos.textoCentro]}>{texto}</Text> : null}
      {children}
    </View>
  );
});

const estilos = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espaco.xxl, gap: espaco.md, minHeight: 240 },
  textoCentro: { textAlign: 'center' },
  botao: { alignSelf: 'stretch', marginTop: espaco.sm },
});
