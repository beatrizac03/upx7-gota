import { memo, useCallback, useState } from 'react';
import { FlatList, LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Cabecalho, Carregando, EstadoErro, EstadoVazio, IconeSuave, OpcoesSegmentadas } from '../../componentes';
import { useDicas } from '../../consultas';
import { useAtualizarAoPuxar } from '../../hooks/useAtualizarAoPuxar';
import { formatarReais } from '../../utils/formatar';
import { cores, espaco, raio } from '../../tema';

const CATEGORIAS = [{ valor: 'personalizadas', rotulo: 'Personalizadas' }, { valor: 'todas', rotulo: 'Todas' }];

const ICONES = {
  chuveiro: 'shower-head',
  torneira: 'water-pump',
  maquina: 'washing-machine',
  planta: 'sprout',
  vassoura: 'broom',
  louca: 'silverware-clean',
  relogio: 'clock-outline',
};

const CartaoDica = memo(function CartaoDica({ dica, aberta, aoAlternar }) {
  const verde = dica.icone === 'planta';
  return (
    <Pressable
      onPress={() => aoAlternar(dica.id)}
      accessibilityRole="button"
      accessibilityState={{ expanded: aberta }}
      style={({ pressed }) => [estilos.cartao, pressed && { opacity: 0.9 }]}
    >
      <View style={estilos.linha}>
        <IconeSuave nome={ICONES[dica.icone] ?? 'water'} familia="mci" tom={verde ? 'sucesso' : 'info'} tamanho={72} />
        <View style={estilos.texto}>
          <Text style={estilos.titulo}>{dica.titulo}</Text>
          <Text style={estilos.descricao}>{dica.descricao}</Text>
          <View style={estilos.etiqueta}>
            <MaterialCommunityIcons name="leaf" size={16} color={cores.sucesso} />
            <Text style={estilos.textoEtiqueta}>
              {dica.economiaReaisMes ? `≈ ${formatarReais(dica.economiaReaisMes)} por mês` : 'Ajuda a reduzir a conta'}
            </Text>
          </View>
        </View>
        <Ionicons name={aberta ? 'chevron-down' : 'chevron-forward'} size={22} color={cores.texto} />
      </View>
      {aberta && <Text style={estilos.detalhes}>{dica.detalhes}</Text>}
    </Pressable>
  );
});

/** Dicas calculadas pelo servidor a partir do consumo real (horário de pico, madrugada, moradores...). */
export function DicasTela() {
  const [categoria, setCategoria] = useState('personalizadas');
  const [aberta, setAberta] = useState(null);
  const dicas = useDicas(categoria);
  const { atualizando, aoAtualizar } = useAtualizarAoPuxar(dicas.refetch);

  const alternar = useCallback((id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAberta((atual) => (atual === id ? null : id));
  }, []);
  const renderizar = useCallback(({ item }) => <CartaoDica dica={item} aberta={item.id === aberta} aoAlternar={alternar} />, [aberta, alternar]);

  return (
    <SafeAreaView style={estilos.raiz} edges={['top']}>
      <FlatList
        data={dicas.data?.itens ?? []}
        keyExtractor={(d) => d.id}
        renderItem={renderizar}
        extraData={aberta}
        contentContainerStyle={estilos.conteudo}
        onRefresh={aoAtualizar}
        refreshing={atualizando}
        ListHeaderComponent={
          <View style={estilos.cabecalho}>
            <Cabecalho titulo="Dicas para a sua casa" voltar={false} />
            <OpcoesSegmentadas opcoes={CATEGORIAS} valor={categoria} aoMudar={setCategoria} />
          </View>
        }
        ListEmptyComponent={
          dicas.isPending ? <Carregando /> : dicas.isError ? <EstadoErro erro={dicas.error} aoTentarNovamente={dicas.refetch} /> : (
            <EstadoVazio icone="happy-outline" titulo="Tudo certo por aqui" texto="Seu consumo está ótimo. Veja a aba Todas para mais ideias." />
          )
        }
      />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: espaco.xl, paddingBottom: espaco.xxxl, gap: espaco.lg },
  cabecalho: { gap: espaco.lg },
  cartao: { backgroundColor: cores.superficie, borderRadius: raio.lg, borderWidth: 1, borderColor: cores.borda, padding: espaco.xl, gap: espaco.md },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.lg },
  texto: { flex: 1, gap: 6 },
  titulo: { fontSize: 18, fontWeight: '700', color: cores.texto },
  descricao: { fontSize: 15, color: cores.textoSecundario, lineHeight: 21 },
  etiqueta: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: cores.sucessoSuave, borderRadius: raio.pilula, paddingHorizontal: espaco.md, paddingVertical: 6 },
  textoEtiqueta: { fontSize: 14, fontWeight: '600', color: cores.sucesso },
  detalhes: { fontSize: 15, color: cores.texto, lineHeight: 22, backgroundColor: cores.fundo, padding: espaco.md, borderRadius: raio.md },
});
