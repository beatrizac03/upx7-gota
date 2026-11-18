import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Botao, Cabecalho, Carregando, CartaoAlerta, EstadoErro, EstadoVazio } from '../../componentes';
import { useAlertas, useAtualizarResidencia, useMarcarAlertaLido, useMarcarTodosLidos } from '../../consultas';
import { useSessao } from '../../contexto/SessaoContexto';
import { useAtualizarAoPuxar } from '../../hooks/useAtualizarAoPuxar';
import { cores, espaco, raio } from '../../tema';

const FILTROS = [
  { chave: 'todos', rotulo: 'Todos', filtro: {} },
  { chave: 'nao-lidos', rotulo: 'Não lidos', filtro: { lido: false } },
  { chave: 'vazamento', rotulo: 'Vazamento', filtro: { tipo: 'vazamento' } },
  { chave: 'acima_meta', rotulo: 'Acima da meta', filtro: { tipo: 'acima_meta' } },
  { chave: 'dispositivo_offline', rotulo: 'Medidor offline', filtro: { tipo: 'dispositivo_offline' } },
  { chave: 'parabens', rotulo: 'Parabéns', filtro: { tipo: 'parabens' } },
];

/** Lista paginada (rolagem infinita) com filtros feitos no servidor. */
export function AlertasTela() {
  const { residencia } = useSessao();
  const [filtroAtivo, setFiltroAtivo] = useState('todos');
  const filtro = FILTROS.find((f) => f.chave === filtroAtivo).filtro;
  const alertas = useAlertas(filtro);
  const marcarLido = useMarcarAlertaLido();
  const marcarTodos = useMarcarTodosLidos();
  const atualizarResidencia = useAtualizarResidencia();
  const { atualizando, aoAtualizar } = useAtualizarAoPuxar(alertas.refetch);

  const lista = useMemo(() => alertas.data?.pages.flatMap((p) => p.dados) ?? [], [alertas.data]);
  const naoLidos = alertas.data?.pages[0]?.naoLidos ?? 0;

  const aoPressionar = useCallback((alerta) => { if (!alerta.lido) marcarLido.mutate(alerta.id); }, [marcarLido]);
  const renderizar = useCallback(({ item }) => <CartaoAlerta alerta={item} aoPressionar={aoPressionar} />, [aoPressionar]);
  const carregarMais = useCallback(() => {
    if (alertas.hasNextPage && !alertas.isFetchingNextPage) alertas.fetchNextPage();
  }, [alertas]);

  const cabecalho = (
    <View style={estilos.cabecalho}>
      <Cabecalho titulo="Alertas" />
      <View style={estilos.preferencia}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={estilos.tituloPreferencia}>Notificar consumo acima da meta</Text>
          <Text style={estilos.legenda}>Receba um aviso quando sua casa ultrapassar o limite definido.</Text>
        </View>
        <Switch
          value={residencia?.notificarAcimaMeta ?? true}
          onValueChange={(valor) => atualizarResidencia.mutate({ notificarAcimaMeta: valor })}
          trackColor={{ true: cores.primariaClara, false: cores.borda }}
          thumbColor="#FFF"
          accessibilityLabel="Notificar consumo acima da meta"
        />
      </View>

      <View style={estilos.linhaTitulo}>
        <Text style={estilos.secao}>Alertas recentes</Text>
        {naoLidos > 0 && (
          <Botao titulo="Marcar todos como lidos" variante="texto" aoPressionar={() => marcarTodos.mutate()} carregando={marcarTodos.isPending} />
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.filtros}>
        {FILTROS.map((f) => {
          const ativo = f.chave === filtroAtivo;
          return (
            <Pressable
              key={f.chave}
              onPress={() => setFiltroAtivo(f.chave)}
              accessibilityRole="button"
              accessibilityState={{ selected: ativo }}
              style={[estilos.chip, ativo && estilos.chipAtivo]}
            >
              <Text style={[estilos.textoChip, ativo && estilos.textoChipAtivo]}>
                {f.rotulo}{f.chave === 'nao-lidos' && naoLidos ? ` (${naoLidos})` : ''}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={estilos.raiz} edges={['top']}>
      <FlatList
        data={lista}
        keyExtractor={(a) => a.id}
        renderItem={renderizar}
        ListHeaderComponent={cabecalho}
        ListEmptyComponent={
          alertas.isPending ? <Carregando /> : alertas.isError ? <EstadoErro erro={alertas.error} aoTentarNovamente={alertas.refetch} /> : (
            <EstadoVazio icone="notifications-off-outline" titulo="Nenhum alerta" texto="Quando algo importante acontecer, aparece aqui." />
          )
        }
        ListFooterComponent={alertas.isFetchingNextPage ? <ActivityIndicator color={cores.primaria} style={{ margin: espaco.lg }} /> : null}
        onEndReached={carregarMais}
        onEndReachedThreshold={0.4}
        onRefresh={aoAtualizar}
        refreshing={atualizando}
        contentContainerStyle={estilos.conteudo}
        initialNumToRender={8}
        windowSize={7}
      />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: espaco.xl, paddingBottom: espaco.xxxl, gap: espaco.lg },
  cabecalho: { gap: espaco.lg },
  preferencia: { flexDirection: 'row', alignItems: 'center', gap: espaco.lg, padding: espaco.xl, backgroundColor: cores.superficie, borderRadius: raio.lg, borderWidth: 1, borderColor: cores.borda },
  tituloPreferencia: { fontSize: 17, fontWeight: '700', color: cores.texto },
  legenda: { fontSize: 15, color: cores.textoSecundario, lineHeight: 21 },
  linhaTitulo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  secao: { fontSize: 26, fontWeight: '700', color: cores.texto },
  filtros: { gap: espaco.sm, paddingRight: espaco.xl },
  chip: { paddingHorizontal: espaco.lg, paddingVertical: espaco.sm, borderRadius: raio.pilula, backgroundColor: cores.campo, borderWidth: 1.5, borderColor: 'transparent' },
  chipAtivo: { backgroundColor: cores.superficie, borderColor: cores.primariaClara },
  textoChip: { fontSize: 15, color: cores.textoSecundario, fontWeight: '500' },
  textoChipAtivo: { color: cores.primariaTexto, fontWeight: '600' },
});
