import { useMemo, useState } from 'react';
import { useAtualizarAoPuxar } from '../../hooks/useAtualizarAoPuxar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  BarraProgresso, Botao, ExplicacaoConta, Carregando, Cartao, EstadoErro, EstadoVazio, Etiqueta, GotaLogo, GraficoBarras, IconeSuave, Tela,
} from '../../componentes';
import { useHistorico, useResumo } from '../../consultas';
import { useSessao } from '../../contexto/SessaoContexto';
import { useTempoReal } from '../../contexto/TempoRealContexto';
import { formatarLitros, formatarNumero, formatarReais, formatarRelativo } from '../../utils/formatar';
import { cores, espaco } from '../../tema';
import { RotuloStatus } from '../medidor/RotuloStatus';

const CONSULTA_HOJE = { agrupamento: 'hora' };

export function InicioTela({ navigation }) {
  const { usuario, residencia } = useSessao();
  const [explicacaoAberta, setExplicacaoAberta] = useState(false);
  const { conectado } = useTempoReal();
  const resumo = useResumo();
  const horas = useHistorico(CONSULTA_HOJE);

  const { atualizando, aoAtualizar } = useAtualizarAoPuxar(resumo.refetch, horas.refetch);
  const dadosHoras = useMemo(
    () => (horas.data?.itens ?? []).map((h) => ({ chave: h.chave, rotulo: `${Number(h.rotulo.slice(0, 2))}h`, valor: h.consumoLitros, futuro: h.futuro, descricao: formatarLitros(h.consumoLitros) })),
    [horas.data],
  );

  const primeiroNome = usuario?.nome?.split(' ')[0] ?? '';
  const naoLidos = resumo.data?.alertasNaoLidos ?? 0;

  const cabecalho = (
    <View style={estilos.cabecalho}>
      <View style={estilos.flex}>
        <Text style={estilos.ola} accessibilityRole="header">Olá, {primeiroNome}</Text>
        <View style={estilos.linhaSub}>
          <Text style={estilos.subtitulo}>Aqui está o resumo da sua casa.</Text>
        </View>
        {conectado && (
          <View style={estilos.aoVivo} accessibilityLabel="Recebendo dados em tempo real">
            <View style={estilos.pontoVivo} />
            <Text style={estilos.textoVivo}>ao vivo</Text>
          </View>
        )}
      </View>
      <Pressable onPress={() => navigation.navigate('Alertas')} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Alertas, ${naoLidos} não lidos`}>
        <Ionicons name="notifications-outline" size={30} color={cores.texto} />
        {naoLidos > 0 && (
          <View style={estilos.badge}><Text style={estilos.textoBadge}>{naoLidos > 9 ? '9+' : naoLidos}</Text></View>
        )}
      </Pressable>
    </View>
  );

  if (resumo.isPending) return <Tela>{cabecalho}<Carregando /></Tela>;
  if (resumo.isError) return <Tela>{cabecalho}<EstadoErro erro={resumo.error} aoTentarNovamente={resumo.refetch} /></Tela>;

  const r = resumo.data;
  if (r.semDados) {
    return (
      <Tela>
        {cabecalho}
        <EstadoVazio icone="water-outline" titulo="Ainda não há leituras" texto="Conecte o leitor Gota ao hidrômetro ou registre uma leitura manual para começar.">
          <Botao titulo="Conectar medidor" aoPressionar={() => navigation.navigate('ConectarMedidor')} estilo={estilos.botaoVazio} />
          <Botao titulo="Registrar leitura manual" variante="texto" aoPressionar={() => navigation.navigate('RegistrarLeitura')} />
        </EstadoVazio>
      </Tela>
    );
  }

  const variacao = r.mes.variacaoMediaDiariaPercentual;
  const diferencaConta = r.conta.diferencaMesAnterior;

  return (
    <Tela aoAtualizar={aoAtualizar} atualizando={atualizando}>
      {cabecalho}

      {r.alertaVazamento && (
        <Cartao tom="perigo" aoPressionar={() => navigation.navigate('Alertas')} acessibilidade="Possível vazamento. Ver alerta">
          <View style={estilos.linha}>
            <IconeSuave nome="water" tom="perigo" tamanho={52} redondo />
            <View style={estilos.flex}>
              <Text style={[estilos.tituloCartao, { color: cores.perigo }]}>{r.alertaVazamento.titulo}</Text>
              <Text style={estilos.texto} numberOfLines={3}>{r.alertaVazamento.mensagem}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={cores.perigo} />
          </View>
        </Cartao>
      )}

      <Cartao titulo="Consumo hoje">
        <View style={estilos.linhaBase}>
          <Text style={estilos.numeroMedio}>{formatarLitros(r.hoje.consumoLitros)}</Text>
          <Text style={estilos.texto}>de {formatarLitros(r.hoje.metaLitros)} (meta)</Text>
        </View>
        <BarraProgresso percentual={r.hoje.percentualMeta} />
        {/* Linha sempre presente (só o texto muda) para o cartão não mudar de altura a cada atualização */}
        <Text style={[estilos.statusMeta, r.hoje.acimaDaMeta && { color: cores.perigo }]} numberOfLines={1}>
          {r.hoje.acimaDaMeta
            ? `▲ ${r.hoje.percentualMeta - 100}% acima da meta`
            : `Faltam ${formatarLitros(r.hoje.metaLitros - r.hoje.consumoLitros)} para a meta`}
        </Text>
        {dadosHoras.length > 0 && (
          <GraficoBarras dados={dadosHoras} altura={90} intervaloRotulos={6} formatarEixo={(v) => `${formatarNumero(v)}`} />
        )}
        <Text style={estilos.legenda}>Última leitura {formatarRelativo(r.ultimaLeitura.lidoEm)} · {r.ultimaLeitura.origem === 'manual' ? 'manual' : 'automática'}</Text>
      </Cartao>

      <Cartao titulo="Consumo deste mês" aoPressionar={() => navigation.navigate('Historico')}>
        <View style={estilos.linha}>
          <GotaLogo tamanho={64} />
          <View style={estilos.flex}>
            <Text style={estilos.numeroGrande}>{formatarLitros(r.mes.consumoLitros)}</Text>
            <Text style={estilos.texto}>Até agora · projeção de {formatarLitros(r.mes.projecaoLitros)}</Text>
          </View>
        </View>
        {variacao !== null && (
          <View style={estilos.linha}>
            <Etiqueta grande tom={variacao <= 0 ? 'sucesso' : 'perigo'} texto={`${variacao > 0 ? '+' : ''}${formatarNumero(variacao)}%`} />
            <Text style={[estilos.texto, estilos.flex]}>
              média diária {variacao <= 0 ? 'menor' : 'maior'} que em {r.mes.mesAnterior.nome}
            </Text>
          </View>
        )}
      </Cartao>

      <Cartao titulo={`Estimativa da conta de ${r.mes.nome}`}>
        <View style={estilos.linha}>
          <IconeSuave nome="receipt-outline" tamanho={72} redondo />
          <View style={estilos.flex}>
            <Text style={estilos.numeroGrande}>{formatarReais(r.conta.estimadaMes)}</Text>
            <Text style={estilos.texto}>por mês · {r.conta.descricao}</Text>
          </View>
        </View>
        {diferencaConta !== null && Math.abs(diferencaConta) >= 0.01 && (
          <View style={estilos.linha}>
            <Etiqueta grande tom={diferencaConta < 0 ? 'sucesso' : 'perigo'} texto={formatarReais(Math.abs(diferencaConta))} />
            <Text style={[estilos.texto, estilos.flex]}>a {diferencaConta < 0 ? 'menos' : 'mais'} que no mês anterior</Text>
          </View>
        )}
        <Pressable onPress={() => setExplicacaoAberta(true)} hitSlop={8} accessibilityRole="button" style={estilos.comoCalculamos}>
          <Ionicons name="information-circle-outline" size={18} color={cores.primariaTexto} />
          <Text style={estilos.textoComoCalculamos}>Como calculamos?</Text>
        </Pressable>
      </Cartao>
      <ExplicacaoConta
        visivel={explicacaoAberta}
        aoFechar={() => setExplicacaoAberta(false)}
        litros={r.mes.projecaoLitros}
        categoria={residencia?.categoriaTarifaria}
        origemConsumo={`Consumo do mês projetado: média de ${formatarLitros(r.mes.mediaDiariaLitros)} por dia (dias já completos de ${r.mes.nome}) × dias do mês. Até agora foram ${formatarLitros(r.mes.consumoLitros)}.`}
      />

      <Cartao titulo="Consumo por pessoa" aoPressionar={() => navigation.navigate('Perspectiva')}>
        <View style={estilos.linha}>
          <IconeSuave nome="people" tamanho={72} redondo />
          <View style={estilos.flex}>
            <View style={estilos.linhaBase}>
              <Text style={estilos.numeroGrande}>{formatarNumero(r.porPessoa.mediaDiariaLitros)}</Text>
              <Text style={estilos.unidade}>L/dia</Text>
            </View>
            <Text style={estilos.texto}>Média na sua casa ({r.porPessoa.moradores} {r.porPessoa.moradores === 1 ? 'morador' : 'moradores'})</Text>
          </View>
        </View>
      </Cartao>

      {r.medidor && (
        <Cartao aoPressionar={() => navigation.navigate('Medidor')} acessibilidade="Ver meu medidor">
          <View style={estilos.linha}>
            <IconeSuave nome="camera-outline" tamanho={48} />
            <View style={estilos.flex}>
              <Text style={estilos.tituloCartao}>{r.medidor.nome}</Text>
              <Text style={estilos.legenda}>Bateria {r.medidor.bateria ?? '—'}% · contato {formatarRelativo(r.medidor.ultimoContato)}</Text>
            </View>
            <RotuloStatus status={r.medidor.status} />
          </View>
        </Cartao>
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: espaco.xl, marginBottom: espaco.xs },
  flex: { flex: 1 },
  ola: { fontSize: 32, fontWeight: '800', color: cores.texto },
  linhaSub: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm, marginTop: 4 },
  subtitulo: { fontSize: 17, color: cores.textoSecundario },
  aoVivo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  pontoVivo: { width: 8, height: 8, borderRadius: 4, backgroundColor: cores.sucesso },
  textoVivo: { fontSize: 13, color: cores.sucesso, fontWeight: '600' },
  badge: { position: 'absolute', top: -4, right: -6, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: cores.perigo, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  textoBadge: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.lg },
  linhaBase: { flexDirection: 'row', alignItems: 'baseline', gap: espaco.sm, flexWrap: 'wrap' },
  tituloCartao: { fontSize: 17, fontWeight: '700', color: cores.texto },
  numeroGrande: { fontSize: 38, fontWeight: '800', color: cores.texto, letterSpacing: -1 },
  numeroMedio: { fontSize: 32, fontWeight: '800', color: cores.texto, letterSpacing: -0.5 },
  unidade: { fontSize: 24, color: cores.texto },
  texto: { fontSize: 15, color: cores.textoSecundario, lineHeight: 21 },
  legenda: { fontSize: 13, color: cores.textoSecundario },
  comoCalculamos: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  textoComoCalculamos: { fontSize: 14, fontWeight: '600', color: cores.primariaTexto },
  statusMeta: { fontSize: 14, fontWeight: '600', color: cores.textoSecundario },
  botaoVazio: { alignSelf: 'stretch', marginTop: espaco.md },
});
