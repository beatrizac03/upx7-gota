import { memo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { FolhaInferior } from './ModalOpcoes';
import { Carregando } from './Estados';
import { useEstimativaConta } from '../consultas';
import { formatarLitros, formatarReais } from '../utils/formatar';
import { cores, espaco, raio } from '../tema';

const m3 = (valor) => valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 3 });

function Linha({ rotulo, valor, destaque = false }) {
  return (
    <View style={[estilos.linha, destaque && estilos.linhaDestaque]}>
      <Text style={[estilos.rotulo, destaque && estilos.forte]}>{rotulo}</Text>
      <Text style={[estilos.valor, destaque && estilos.forte]}>{valor}</Text>
    </View>
  );
}

/**
 * "Como calculamos?": mostra a conta estimada do MÊS passo a passo
 * (tarifa fixa + faixas progressivas de água + esgoto), com os números reais
 * calculados pelo servidor para o consumo informado.
 */
export const ExplicacaoConta = memo(function ExplicacaoConta({ visivel, aoFechar, litros, categoria = 'residencial', origemConsumo }) {
  const { data: conta, isPending } = useEstimativaConta(litros, categoria, visivel);

  return (
    <FolhaInferior visivel={visivel} titulo="Como calculamos a conta" aoFechar={aoFechar}>
      {isPending || !conta ? <Carregando /> : (
        <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ gap: espaco.md }}>
          <Text style={estilos.texto}>
            É uma estimativa <Text style={estilos.forte}>mensal</Text> de água + esgoto para{' '}
            <Text style={estilos.forte}>{formatarLitros(litros)} ({m3(conta.m3)} m³)</Text> no mês.
          </Text>
          {origemConsumo ? <Text style={estilos.texto}>{origemConsumo}</Text> : null}

          <View style={estilos.tabela}>
            <Linha rotulo="Tarifa fixa de água" valor={formatarReais(conta.tarifaFixa)} />
            {conta.faixas.map((faixa) => (
              <Linha
                key={faixa.deM3}
                rotulo={`${faixa.ateM3 ? `${faixa.deM3} a ${faixa.ateM3} m³` : `acima de ${faixa.deM3} m³`}: ${m3(faixa.volumeM3)} × ${formatarReais(faixa.valorM3)}`}
                valor={formatarReais(faixa.subtotal)}
              />
            ))}
            <Linha rotulo="Água" valor={formatarReais(conta.agua)} destaque />
            <Linha rotulo={`Esgoto (${Math.round(conta.percentualEsgoto * 100)}% da água)`} valor={formatarReais(conta.esgoto)} />
            <Linha rotulo="Total estimado do mês" valor={formatarReais(conta.total)} destaque />
          </View>

          <Text style={estilos.nota}>
            Tarifa progressiva: cada faixa de consumo custa mais por m³ que a anterior, por isso economizar no fim do mês pesa mais.
            Categoria: {conta.categoria}.
          </Text>
          <Text style={estilos.nota}>⚠️ {conta.fonte}</Text>
        </ScrollView>
      )}
    </FolhaInferior>
  );
});

const estilos = StyleSheet.create({
  texto: { fontSize: 15, color: cores.textoSecundario, lineHeight: 22 },
  forte: { fontWeight: '700', color: cores.texto },
  tabela: { borderRadius: raio.md, borderWidth: 1, borderColor: cores.borda, overflow: 'hidden' },
  linha: { flexDirection: 'row', justifyContent: 'space-between', gap: espaco.md, paddingVertical: espaco.sm, paddingHorizontal: espaco.md, borderBottomWidth: 1, borderBottomColor: cores.borda },
  linhaDestaque: { backgroundColor: cores.fundo },
  rotulo: { flex: 1, fontSize: 14, color: cores.textoSecundario },
  valor: { fontSize: 14, color: cores.texto, fontVariant: ['tabular-nums'] },
  nota: { fontSize: 12, color: cores.textoTerciario, lineHeight: 17 },
});
