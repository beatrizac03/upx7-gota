import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Botao, Cabecalho, Cartao, Carregando, EstadoErro, IconeSuave, Passos, Tela } from '../../componentes';
import { useAtualizarResidencia, useSimulacaoMeta } from '../../consultas';
import { useSessao } from '../../contexto/SessaoContexto';
import { useValorAtrasado } from '../../hooks/useValorAtrasado';
import { formatarNumero, formatarReais } from '../../utils/formatar';
import { cores, espaco } from '../../tema';

/** Define a meta diária. Os valores em R$ vêm do servidor (mesma tarifa das outras telas). */
export function SuaMetaTela({ navigation, route }) {
  const { cadastroInicial = false, residencia: residenciaParametro } = route.params ?? {};
  const sessao = useSessao();
  const residencia = residenciaParametro ?? sessao.residencia;
  const [meta, setMeta] = useState(residencia?.metaDiariaLitros ?? 500);
  const metaConsulta = useValorAtrasado(meta, 250);
  const simulacao = useSimulacaoMeta(metaConsulta);
  const salvar = useAtualizarResidencia();

  const aoSalvar = () =>
    salvar.mutate({ metaDiariaLitros: meta }, {
      // No cadastro inicial, salvar a residência na sessão já leva para o app.
      onSuccess: () => { if (!cadastroInicial) navigation.goBack(); },
    });

  if (simulacao.isPending) return <Tela><Carregando /></Tela>;
  if (simulacao.isError && !simulacao.data) return <Tela><EstadoErro erro={simulacao.error} aoTentarNovamente={simulacao.refetch} /></Tela>;

  const dados = simulacao.data;
  const { minimo, maximo } = dados.limites;
  const sugestao = dados.sugestao;

  return (
    <Tela decorada>
      {cadastroInicial && <Passos atual={3} total={3} />}
      <Cabecalho titulo="Sua meta" voltar={!cadastroInicial} subtitulo="Defina um limite de consumo diário para a sua casa." />

      <Cartao>
        <View style={estilos.valor} accessibilityLiveRegion="polite">
          <Text style={estilos.numero}>{formatarNumero(meta)}</Text>
          <Text style={estilos.unidade}>L/dia</Text>
        </View>
        <Slider
          minimumValue={minimo}
          maximumValue={maximo}
          step={10}
          value={Math.min(maximo, Math.max(minimo, meta))}
          onValueChange={(v) => setMeta(Math.round(v))}
          minimumTrackTintColor={cores.primariaClara}
          maximumTrackTintColor={cores.borda}
          thumbTintColor={cores.primaria}
          accessibilityLabel="Meta diária em litros"
          style={estilos.slider}
        />
        <View style={estilos.limites}>
          <Text style={estilos.legenda}>{minimo}</Text>
          <Text style={estilos.legenda}>{maximo}</Text>
        </View>
      </Cartao>

      <Cartao>
        <View style={estilos.linha}>
          <IconeSuave nome="bullseye-arrow" familia="mci" tom="sucesso" tamanho={64} redondo />
          <View style={estilos.flex}>
            <Text style={estilos.rotulo}>Sugestão para sua casa</Text>
            <Text style={estilos.destaque}>Entre {sugestao.minimoLitros} e {sugestao.maximoLitros} L/dia</Text>
            <Text style={estilos.legenda}>{sugestao.texto}.</Text>
          </View>
        </View>
      </Cartao>

      <Cartao titulo="Com essa meta">
        <View style={estilos.linha}>
          <IconeSuave nome="wallet-outline" tamanho={56} redondo />
          <View style={estilos.flex}>
            <Text style={estilos.legenda}>Conta estimada usando a meta todo dia:</Text>
            <Text style={estilos.destaque}>{formatarReais(dados.contaEstimadaComMeta)}</Text>
          </View>
        </View>
        <View style={estilos.divisor} />
        <View style={estilos.linha}>
          <IconeSuave nome="sprout" familia="mci" tom="sucesso" tamanho={56} redondo />
          <View style={estilos.flex}>
            {dados.economiaMensal === null ? (
              <Text style={estilos.legenda}>A economia aparece quando houver leituras deste mês.</Text>
            ) : dados.economiaMensal > 0 ? (
              <>
                <Text style={estilos.legenda}>Economia estimada:</Text>
                <Text style={estilos.destaque}>{formatarReais(dados.economiaMensal)} no mês</Text>
              </>
            ) : (
              <>
                <Text style={estilos.legenda}>Sua média atual é {formatarNumero(dados.mediaDiariaAtualLitros)} L/dia.</Text>
                <Text style={[estilos.destaque, { color: cores.sucesso }]}>Você já está dentro dessa meta</Text>
              </>
            )}
          </View>
        </View>
      </Cartao>

      {salvar.isError && <Text style={estilos.erro}>{salvar.error.message}</Text>}
      <Botao titulo={cadastroInicial ? 'Salvar meta e começar' : 'Salvar meta'} aoPressionar={aoSalvar} carregando={salvar.isPending} />
      <View style={estilos.rodape}>
        <MaterialCommunityIcons name="information-outline" size={16} color={cores.textoTerciario} />
        <Text style={estilos.nota}>Você recebe um alerta quando a casa passa da meta no dia.</Text>
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  valor: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: espaco.sm },
  numero: { fontSize: 64, fontWeight: '800', color: cores.texto, letterSpacing: -2 },
  unidade: { fontSize: 26, color: cores.texto },
  slider: { width: '100%', height: 44 },
  limites: { flexDirection: 'row', justifyContent: 'space-between' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.lg },
  flex: { flex: 1, gap: 2 },
  rotulo: { fontSize: 16, fontWeight: '600', color: cores.texto },
  destaque: { fontSize: 20, fontWeight: '700', color: cores.texto },
  legenda: { fontSize: 15, color: cores.textoSecundario },
  divisor: { height: 1, backgroundColor: cores.borda },
  erro: { color: cores.perigo, fontSize: 15 },
  rodape: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  nota: { fontSize: 13, color: cores.textoTerciario },
});
