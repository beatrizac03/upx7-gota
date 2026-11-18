import { useMemo, useState } from 'react';
import { useAtualizarAoPuxar } from '../../hooks/useAtualizarAoPuxar';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Cabecalho, Carregando, Cartao, EstadoErro, GraficoBarras, IconeSuave, OpcoesSegmentadas, Tela } from '../../componentes';
import { useHistorico } from '../../consultas';
import { formatarLitros, formatarNumero, formatarReais } from '../../utils/formatar';
import { cores, espaco } from '../../tema';

const MODOS = [{ valor: 'consumo', rotulo: 'Consumo' }, { valor: 'custo', rotulo: 'Custo (R$)' }];
const CONSULTA_MESES = { agrupamento: 'mes', quantidade: 6 };
const CONSULTA_DIAS = { agrupamento: 'dia', quantidade: 30 };

const eixoLitros = (v) => (v >= 1000 ? `${formatarNumero(v / 1000)} mil` : formatarNumero(v));
const eixoReais = (v) => `R$ ${formatarNumero(v)}`;

/**
 * Mesmos dados do Início: o mês atual mostra o consumo até agora e a conta
 * projetada (marcados como parciais), então os números nunca se contradizem.
 */
export function HistoricoTela() {
  const [modo, setModo] = useState('consumo');
  const [selecionado, setSelecionado] = useState(null);
  const meses = useHistorico(CONSULTA_MESES);
  const dias = useHistorico(CONSULTA_DIAS);

  const itens = useMemo(() => meses.data?.itens ?? [], [meses.data]);
  const chaveSelecionada = selecionado ?? itens.at(-1)?.chave;
  const indice = itens.findIndex((m) => m.chave === chaveSelecionada);
  const mes = itens[indice];
  const anterior = indice > 0 ? itens[indice - 1] : null;

  const dadosMeses = useMemo(
    () => itens.map((m) => ({
      chave: m.chave,
      rotulo: m.rotulo,
      valor: modo === 'consumo' ? m.consumoLitros : m.custoEstimado,
      descricao: modo === 'consumo' ? formatarLitros(m.consumoLitros) : formatarReais(m.custoEstimado),
    })),
    [itens, modo],
  );

  const dadosDias = useMemo(
    () => (dias.data?.itens ?? []).map((d) => ({ chave: d.chave, rotulo: d.rotulo.slice(0, 2), valor: d.consumoLitros, alerta: d.acimaDaMeta, descricao: formatarLitros(d.consumoLitros) })),
    [dias.data],
  );
  const diasAcima = dadosDias.filter((d) => d.alerta).length;

  const { atualizando, aoAtualizar } = useAtualizarAoPuxar(meses.refetch, dias.refetch);

  if (meses.isPending) return <Tela><Cabecalho titulo="Histórico" voltar={false} /><Carregando /></Tela>;
  if (meses.isError) return <Tela><Cabecalho titulo="Histórico" voltar={false} /><EstadoErro erro={meses.error} aoTentarNovamente={meses.refetch} /></Tela>;

  const diferencaCusto = mes && anterior && !anterior.semDados ? mes.custoEstimado - anterior.custoEstimado : null;

  return (
    <Tela aoAtualizar={aoAtualizar} atualizando={atualizando}>
      <Cabecalho titulo="Histórico" voltar={false} />
      <OpcoesSegmentadas opcoes={MODOS} valor={modo} aoMudar={setModo} />

      {mes && (
        <View>
          <Text style={estilos.numero}>{modo === 'consumo' ? formatarLitros(mes.consumoLitros) : formatarReais(mes.custoEstimado)}</Text>
          <Text style={estilos.periodo}>
            em {mes.nome} de {mes.ano}
            {mes.emAndamento ? (modo === 'consumo' ? ` · até agora (projeção ${formatarLitros(mes.projecaoLitros)})` : ' · projeção do mês') : ''}
          </Text>
        </View>
      )}

      <GraficoBarras
        dados={dadosMeses}
        altura={210}
        selecionada={chaveSelecionada}
        aoSelecionar={setSelecionado}
        formatarEixo={modo === 'consumo' ? eixoLitros : eixoReais}
      />
      <Text style={estilos.dica}>Toque em um mês para ver os detalhes.</Text>

      {mes && (
        <Cartao>
          <View style={estilos.linha}>
            <View style={estilos.flex}>
              <Text style={estilos.tituloCartao}>Conta estimada {mes.emAndamento ? 'do mês' : `de ${mes.nome}`}</Text>
              <Text style={estilos.valorConta}>{formatarReais(mes.custoEstimado)}</Text>
              <Text style={estilos.legenda}>Média de {formatarLitros(mes.mediaDiariaLitros)} por dia</Text>
            </View>
            <IconeSuave nome="stats-chart" tamanho={72} />
          </View>
          {diferencaCusto !== null && Math.abs(diferencaCusto) >= 0.01 && (
            <View style={estilos.linha}>
              <View style={[estilos.seta, { backgroundColor: diferencaCusto < 0 ? cores.sucessoSuave : cores.perigoSuave }]}>
                <Ionicons name={diferencaCusto < 0 ? 'arrow-down' : 'arrow-up'} size={28} color={diferencaCusto < 0 ? cores.sucesso : cores.perigo} />
              </View>
              <View style={estilos.flex}>
                <Text style={[estilos.diferenca, { color: diferencaCusto < 0 ? cores.sucesso : cores.perigo }]}>{formatarReais(Math.abs(diferencaCusto))}</Text>
                <Text style={estilos.legenda}>a {diferencaCusto < 0 ? 'menos' : 'mais'} que em {anterior.nome}</Text>
              </View>
            </View>
          )}
        </Cartao>
      )}

      <Cartao titulo="Últimos 30 dias">
        {dias.isPending ? <Carregando /> : (
          <>
            <GraficoBarras
              dados={dadosDias}
              altura={140}
              intervaloRotulos={7}
              linhaReferencia={dias.data?.metaDiariaLitros}
              rotuloReferencia="meta"
              formatarEixo={formatarNumero}
            />
            <Text style={estilos.legenda}>
              {diasAcima === 0 ? 'Nenhum dia acima da meta. Muito bem!' : `${diasAcima} ${diasAcima === 1 ? 'dia' : 'dias'} acima da meta de ${formatarLitros(dias.data.metaDiariaLitros)}.`}
            </Text>
          </>
        )}
      </Cartao>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  numero: { fontSize: 44, fontWeight: '800', color: cores.texto, letterSpacing: -1 },
  periodo: { fontSize: 17, color: cores.textoSecundario },
  dica: { fontSize: 13, color: cores.textoTerciario, textAlign: 'center' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.lg },
  flex: { flex: 1, gap: 2 },
  tituloCartao: { fontSize: 18, fontWeight: '600', color: cores.texto },
  valorConta: { fontSize: 36, fontWeight: '800', color: cores.texto, letterSpacing: -0.5 },
  seta: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  diferenca: { fontSize: 22, fontWeight: '700' },
  legenda: { fontSize: 15, color: cores.textoSecundario },
});
