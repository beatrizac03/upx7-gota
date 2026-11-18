import { StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Cabecalho, Carregando, Cartao, EstadoErro, EstadoVazio, IconeSuave, Tela } from '../../componentes';
import { usePerspectiva } from '../../consultas';
import { useAtualizarAoPuxar } from '../../hooks/useAtualizarAoPuxar';
import { formatarLitros, formatarNumero, formatarReais } from '../../utils/formatar';
import { cores, espaco } from '../../tema';

/** "Sua casa em perspectiva": comparação com casas similares da cidade. */
export function PerspectivaTela() {
  const perspectiva = usePerspectiva();
  const { atualizando, aoAtualizar } = useAtualizarAoPuxar(perspectiva.refetch);

  if (perspectiva.isPending) return <Tela><Cabecalho titulo="Sua casa em perspectiva" /><Carregando /></Tela>;
  if (perspectiva.isError) return <Tela><Cabecalho titulo="Sua casa em perspectiva" /><EstadoErro erro={perspectiva.error} aoTentarNovamente={perspectiva.refetch} /></Tela>;

  const p = perspectiva.data;
  if (p.semDados) {
    return (
      <Tela>
        <Cabecalho titulo="Sua casa em perspectiva" />
        <EstadoVazio titulo="Ainda sem dados deste mês" texto="Assim que chegarem leituras, comparamos sua casa com a média de casas similares." />
      </Tela>
    );
  }

  const economiza = p.situacao !== 'acima';
  const tom = economiza ? 'sucesso' : 'perigo';
  const cor = economiza ? cores.sucesso : cores.perigo;

  return (
    <Tela aoAtualizar={aoAtualizar} atualizando={atualizando}>
      <Cabecalho titulo="Sua casa em perspectiva" />

      <Cartao tom={tom}>
        <View style={estilos.linha}>
          <MaterialCommunityIcons name={economiza ? 'home-heart' : 'home-alert'} size={88} color={cor} />
          <View style={estilos.flex}>
            <Text style={estilos.texto}>Sua casa consome</Text>
            <Text style={[estilos.destaque, { color: cor }]}>
              {p.situacao === 'na_media' ? 'na média' : `${p.percentualDiferenca}% ${economiza ? 'menos' : 'mais'} água`}
            </Text>
            <Text style={estilos.texto}>que a média de casas similares em {p.cidade}.</Text>
          </View>
        </View>
      </Cartao>

      <Text style={estilos.secao}>Isso representa</Text>

      <Cartao>
        <View style={estilos.linha}>
          <IconeSuave nome="shower-head" familia="mci" tamanho={88} />
          <View style={estilos.flex}>
            <Text style={estilos.texto}>O mesmo que</Text>
            <Text style={estilos.numero}>{formatarNumero(p.equivalenciaBanhos)} banhos</Text>
            <Text style={estilos.texto}>de 10 minutos {economiza ? 'a menos' : 'a mais'} por mês ({formatarLitros(p.diferencaLitrosMes)}).</Text>
          </View>
        </View>
      </Cartao>

      <Cartao>
        <View style={estilos.linha}>
          <IconeSuave nome="cash-multiple" familia="mci" tom={tom} tamanho={88} />
          <View style={estilos.flex}>
            <Text style={estilos.texto}>{economiza ? 'Economia estimada de' : 'Gasto extra estimado de'}</Text>
            <Text style={estilos.numero}>{formatarReais(p.diferencaReaisMes)}</Text>
            <Text style={estilos.texto}>em {p.mesReferencia}.</Text>
          </View>
        </View>
      </Cartao>

      <Cartao>
        <Text style={estilos.texto}>
          Sua casa: <Text style={estilos.forte}>{formatarNumero(p.porPessoaLitrosDia)} L/pessoa/dia</Text>{'\n'}
          Referência: <Text style={estilos.forte}>{formatarNumero(p.referenciaPorPessoaLitrosDia)} L/pessoa/dia</Text>
        </Text>
      </Cartao>

      <View style={estilos.nota}>
        <Ionicons name="information-circle-outline" size={20} color={cores.textoSecundario} />
        <Text style={estilos.textoNota}>Estimativa em R$ calculada com base na tarifa residencial de água e esgoto.</Text>
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.lg },
  flex: { flex: 1, gap: 2 },
  texto: { fontSize: 16, color: cores.texto, lineHeight: 23 },
  forte: { fontWeight: '700' },
  destaque: { fontSize: 26, fontWeight: '800' },
  numero: { fontSize: 30, fontWeight: '800', color: cores.texto },
  secao: { fontSize: 24, fontWeight: '700', color: cores.texto, marginTop: espaco.sm },
  nota: { flexDirection: 'row', gap: espaco.sm, alignItems: 'center' },
  textoNota: { flex: 1, fontSize: 14, color: cores.textoSecundario },
});
