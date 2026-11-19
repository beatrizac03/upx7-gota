import { memo, useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Botao, Cabecalho, Carregando, Cartao, DigitosHidrometro, EstadoErro, IconeSuave } from '../../componentes';
import { useDispositivos, useLeituras, useResumo } from '../../consultas';
import { useSessao } from '../../contexto/SessaoContexto';
import { useAtualizarAoPuxar } from '../../hooks/useAtualizarAoPuxar';
import { formatarDataHora, formatarLitros, formatarRelativo } from '../../utils/formatar';
import { cores, espaco, raio } from '../../tema';
import { juntarPaginasSemRepetir } from '../../utils/listas';
import { RotuloStatus } from './RotuloStatus';
import { PainelSimulacao } from './PainelSimulacao';

const FILTRO_LEITURAS = { ordem: 'desc' };
const ICONE_ORIGEM = { sensor: 'camera-outline', simulador: 'hardware-chip-outline', manual: 'create-outline' };

const ItemLeitura = memo(function ItemLeitura({ leitura }) {
  return (
    <View style={estilos.item}>
      <Ionicons name={ICONE_ORIGEM[leitura.origem]} size={20} color={cores.textoSecundario} />
      <View style={estilos.flex}>
        <Text style={estilos.itemData}>{formatarDataHora(leitura.lidoEm)}</Text>
        <Text style={estilos.legenda}>{leitura.leituraM3.toFixed(3).replace('.', ',')} m³ · {leitura.origem}</Text>
      </View>
      <Text style={estilos.itemConsumo}>+{formatarLitros(leitura.consumoLitros)}</Text>
    </View>
  );
});

const dividirLeitura = (m3) => {
  const [inteiro, fracao] = m3.toFixed(3).split('.');
  return { inteiro, fracao };
};

/** "Registrar leitura" virou "Meu medidor": status do leitor automático e leitura manual como opção secundária. */
export function MeuMedidorTela({ navigation }) {
  const { residencia } = useSessao();
  const dispositivos = useDispositivos();
  const resumo = useResumo();
  const leituras = useLeituras(FILTRO_LEITURAS);

  const lista = useMemo(() => juntarPaginasSemRepetir(leituras.data?.pages), [leituras.data]);
  const medidor = dispositivos.data?.dados?.[0];
  const ultima = resumo.data?.ultimaLeitura;

  const carregarMais = useCallback(() => {
    if (leituras.hasNextPage && !leituras.isFetchingNextPage) leituras.fetchNextPage();
  }, [leituras]);
  const { atualizando, aoAtualizar } = useAtualizarAoPuxar(dispositivos.refetch, resumo.refetch, leituras.refetch);
  const renderizar = useCallback(({ item }) => <ItemLeitura leitura={item} />, []);

  if (dispositivos.isPending) return <SafeAreaView style={estilos.raiz}><Carregando /></SafeAreaView>;
  if (dispositivos.isError) return <SafeAreaView style={estilos.raiz}><EstadoErro erro={dispositivos.error} aoTentarNovamente={dispositivos.refetch} /></SafeAreaView>;

  const cabecalho = (
    <View style={estilos.cabecalho}>
      <Cabecalho titulo="Meu medidor" voltar={false} />

      {medidor ? (
        <Cartao>
          <View style={estilos.linha}>
            <IconeSuave nome="camera-outline" tamanho={52} />
            <View style={estilos.flex}>
              <Text style={estilos.nome}>{medidor.nome}</Text>
              <Text style={estilos.legenda}>{medidor.id} · {medidor.tipo === 'simulado' ? 'simulado' : 'câmera'}</Text>
            </View>
            <RotuloStatus status={medidor.status} />
          </View>

          {ultima && (
            <>
              <DigitosHidrometro {...dividirLeitura(ultima.leituraM3)} />
              <Text style={[estilos.legenda, estilos.centro]}>Última leitura: {formatarDataHora(ultima.lidoEm)}</Text>
            </>
          )}

          <View style={estilos.indicadores}>
            <Indicador icone={iconeBateria(medidor.bateria)} rotulo="Bateria" valor={medidor.bateria !== null ? `${medidor.bateria}%` : '—'} />
            <Indicador icone="sync-outline" rotulo="Último contato" valor={formatarRelativo(medidor.ultimoContato)} />
          </View>
          {medidor.status === 'offline' && (
            <Text style={estilos.aviso}>O leitor está sem sinal. Verifique o Wi-Fi perto do hidrômetro e a bateria. As leituras guardadas serão enviadas quando ele voltar.</Text>
          )}
        </Cartao>
      ) : (
        <Cartao>
          <View style={[estilos.centro, { gap: espaco.md }]}>
            <IconeSuave nome="camera-outline" tamanho={72} redondo />
            <Text style={estilos.nome}>Nenhum medidor conectado</Text>
            <Text style={[estilos.legenda, estilos.textoCentro]}>
              {residencia?.possuiHidrometroIndividual === false
                ? 'Seu imóvel não tem hidrômetro individual. Você pode registrar leituras manualmente.'
                : 'Com o leitor Gota, o consumo chega sozinho e você recebe alertas de vazamento.'}
            </Text>
          </View>
          <Botao titulo="Conectar medidor" icone="wifi" aoPressionar={() => navigation.navigate('ConectarMedidor')} />
        </Cartao>
      )}

      {medidor?.tipo === 'simulado' && <PainelSimulacao />}

      <Botao titulo="Registrar leitura manual" variante="secundario" icone="create-outline" aoPressionar={() => navigation.navigate('RegistrarLeitura')} />
      <Text style={estilos.secao}>Leituras recentes</Text>
    </View>
  );

  return (
    <SafeAreaView style={estilos.raiz} edges={['top']}>
      <FlatList
        data={lista}
        keyExtractor={(l) => l.id}
        renderItem={renderizar}
        ListHeaderComponent={cabecalho}
        ListEmptyComponent={leituras.isPending ? <Carregando /> : <Text style={[estilos.legenda, estilos.textoCentro]}>Nenhuma leitura ainda.</Text>}
        ListFooterComponent={leituras.isFetchingNextPage ? <ActivityIndicator color={cores.primaria} style={{ margin: espaco.lg }} /> : null}
        onEndReached={carregarMais}
        onEndReachedThreshold={0.4}
        onRefresh={aoAtualizar}
        refreshing={atualizando}
        contentContainerStyle={estilos.conteudo}
        initialNumToRender={12}
        windowSize={7}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}

function iconeBateria(nivel) {
  if (nivel === null || nivel === undefined) return 'battery-dead-outline';
  if (nivel > 60) return 'battery-full-outline';
  if (nivel > 20) return 'battery-half-outline';
  return 'battery-dead-outline';
}

function Indicador({ icone, rotulo, valor }) {
  return (
    <View style={estilos.indicador}>
      <Ionicons name={icone} size={22} color={cores.primaria} />
      <View>
        <Text style={estilos.legenda}>{rotulo}</Text>
        <Text style={estilos.valorIndicador}>{valor}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: espaco.xl, paddingBottom: espaco.xxxl },
  cabecalho: { gap: espaco.lg, marginBottom: espaco.md },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  flex: { flex: 1 },
  nome: { fontSize: 18, fontWeight: '700', color: cores.texto },
  legenda: { fontSize: 14, color: cores.textoSecundario },
  centro: { alignItems: 'center', alignSelf: 'center' },
  textoCentro: { textAlign: 'center' },
  indicadores: { flexDirection: 'row', gap: espaco.md },
  indicador: { flex: 1, flexDirection: 'row', gap: espaco.sm, alignItems: 'center', backgroundColor: cores.fundo, padding: espaco.md, borderRadius: raio.md },
  valorIndicador: { fontSize: 16, fontWeight: '700', color: cores.texto },
  aviso: { fontSize: 14, color: cores.perigo, lineHeight: 20 },
  secao: { fontSize: 20, fontWeight: '700', color: cores.texto, marginTop: espaco.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, paddingVertical: espaco.md, borderBottomWidth: 1, borderBottomColor: cores.borda },
  itemData: { fontSize: 15, color: cores.texto, fontWeight: '500' },
  itemConsumo: { fontSize: 15, fontWeight: '700', color: cores.primariaTexto },
});
