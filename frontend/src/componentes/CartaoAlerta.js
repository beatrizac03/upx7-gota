import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cores, espaco, raio } from '../tema';
import { formatarData, formatarHora } from '../utils/formatar';

export const VISUAL_ALERTA = {
  acima_meta: { icone: 'arrow-up', cor: cores.perigo, fundo: cores.perigoSuave },
  vazamento: { icone: 'water', cor: cores.perigo, fundo: cores.perigoSuave },
  parabens: { icone: 'arrow-down', cor: cores.sucesso, fundo: cores.sucessoSuave },
  dispositivo_offline: { icone: 'cloud-offline', cor: cores.aviso, fundo: cores.avisoSuave },
};

/** Item da lista de alertas (memoizado para listas longas). */
export const CartaoAlerta = memo(function CartaoAlerta({ alerta, aoPressionar }) {
  const visual = VISUAL_ALERTA[alerta.tipo] ?? VISUAL_ALERTA.acima_meta;
  return (
    <Pressable
      onPress={aoPressionar ? () => aoPressionar(alerta) : undefined}
      accessibilityRole="button"
      accessibilityLabel={`${alerta.lido ? '' : 'Não lido. '}${alerta.titulo}. ${alerta.mensagem}`}
      style={({ pressed }) => [estilos.cartao, !alerta.lido && estilos.naoLido, pressed && { opacity: 0.85 }]}
    >
      <View style={[estilos.icone, { backgroundColor: visual.fundo }]}>
        <Ionicons name={visual.icone} size={30} color={visual.cor} />
      </View>
      <View style={estilos.texto}>
        <View style={estilos.linhaTitulo}>
          <Text style={estilos.titulo}>{alerta.titulo}</Text>
          {!alerta.lido && <View style={estilos.ponto} />}
        </View>
        <Text style={estilos.data}>{formatarData(alerta.criadoEm)} · {formatarHora(alerta.criadoEm)}</Text>
        <Text style={estilos.mensagem}>{alerta.mensagem}</Text>
      </View>
    </Pressable>
  );
});

const estilos = StyleSheet.create({
  cartao: { flexDirection: 'row', gap: espaco.lg, padding: espaco.xl, backgroundColor: cores.superficie, borderRadius: raio.lg, borderWidth: 1, borderColor: cores.borda },
  naoLido: { borderColor: cores.primariaClara },
  icone: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  texto: { flex: 1, gap: 4 },
  linhaTitulo: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  titulo: { flexShrink: 1, fontSize: 18, fontWeight: '700', color: cores.texto },
  ponto: { width: 9, height: 9, borderRadius: 5, backgroundColor: cores.primaria },
  data: { fontSize: 15, color: cores.textoSecundario },
  mensagem: { fontSize: 15, color: cores.textoSecundario, lineHeight: 21 },
});
