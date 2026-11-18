import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cores, raio } from '../tema';

function BotaoContador({ icone, aoPressionar, desabilitado, descricao }) {
  return (
    <Pressable
      onPress={aoPressionar}
      disabled={desabilitado}
      accessibilityRole="button"
      accessibilityLabel={descricao}
      style={({ pressed }) => [estilos.botao, (pressed || desabilitado) && { opacity: desabilitado ? 0.4 : 0.7 }]}
    >
      <Ionicons name={icone} size={26} color={cores.texto} />
    </Pressable>
  );
}

/** Seletor numérico − 4 + (quantidade de moradores). */
export const Contador = memo(function Contador({ valor, aoMudar, minimo = 1, maximo = 30, rotulo = 'valor' }) {
  return (
    <View style={estilos.raiz} accessibilityLabel={`${rotulo}: ${valor}`}>
      <BotaoContador icone="remove" aoPressionar={() => aoMudar(valor - 1)} desabilitado={valor <= minimo} descricao={`Diminuir ${rotulo}`} />
      <Text style={estilos.valor}>{valor}</Text>
      <BotaoContador icone="add" aoPressionar={() => aoMudar(valor + 1)} desabilitado={valor >= maximo} descricao={`Aumentar ${rotulo}`} />
    </View>
  );
});

const estilos = StyleSheet.create({
  raiz: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  botao: { width: 64, height: 52, borderRadius: raio.md, backgroundColor: cores.campo, alignItems: 'center', justifyContent: 'center' },
  valor: { fontSize: 30, fontWeight: '800', color: cores.texto, minWidth: 48, textAlign: 'center' },
});
