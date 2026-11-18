import { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cores, espaco } from '../tema';

const ESPACO_ENTRE_BARRAS = 4;
const LARGURA_ROTULO = 48;

/** Arredonda o topo do eixo para um valor "bonito" (15 mil, 750, 60...). */
function topoEixo(maximo) {
  if (maximo <= 0) return 3;
  const marca = maximo / 3;
  const magnitude = 10 ** Math.floor(Math.log10(marca));
  const passo = [1, 2, 2.5, 5, 10].find((p) => p * magnitude >= marca);
  return passo * magnitude * 3;
}

const BarraMemo = memo(function Barra({ item, altura, topo, selecionada, aoSelecionar, corDestaque }) {
  const proporcao = Math.max(0, item.valor) / topo;
  const cor = item.futuro ? 'transparent' : selecionada ? corDestaque : item.alerta ? '#F4A3A1' : '#CFE6F8';
  return (
    <Pressable
      style={[estilos.coluna, { height: altura }]}
      onPress={aoSelecionar ? () => aoSelecionar(item.chave) : undefined}
      disabled={!aoSelecionar}
      accessibilityRole={aoSelecionar ? 'button' : undefined}
      accessibilityLabel={`${item.rotulo}: ${item.descricao ?? item.valor}`}
      accessibilityState={{ selected: selecionada }}
    >
      <View style={[estilos.barra, { height: Math.max(item.valor > 0 ? 3 : 0, proporcao * altura), backgroundColor: cor }, item.futuro && estilos.futuro]} />
    </Pressable>
  );
});

/**
 * Gráfico de barras leve, feito com Views (sem biblioteca de gráficos):
 * renderiza rápido e cada barra é memoizada. Os rótulos ficam numa linha
 * própria, posicionados pela largura medida, para não serem cortados em barras finas.
 * dados: [{ chave, rotulo, valor, alerta?, futuro?, descricao? }]
 */
export const GraficoBarras = memo(function GraficoBarras({
  dados, altura = 200, selecionada, aoSelecionar, formatarEixo = String, linhaReferencia, rotuloReferencia,
  intervaloRotulos = 1, corDestaque = cores.primaria,
}) {
  const [largura, setLargura] = useState(0);
  const aoMedir = useCallback((e) => setLargura(e.nativeEvent.layout.width), []);
  const topo = useMemo(
    () => topoEixo(Math.max(linhaReferencia ?? 0, ...dados.map((d) => d.valor))),
    [dados, linhaReferencia],
  );
  const marcas = [topo, (topo * 2) / 3, topo / 3, 0];
  const larguraColuna = dados.length ? (largura - ESPACO_ENTRE_BARRAS * (dados.length - 1)) / dados.length : 0;

  return (
    <View style={estilos.raiz}>
      <View style={estilos.grafico}>
        <View style={[estilos.grade, { height: altura }]} pointerEvents="none">
          {marcas.map((marca) => <View key={marca} style={estilos.linhaGrade} />)}
          {linhaReferencia ? (
            <View style={[estilos.referencia, { bottom: (linhaReferencia / topo) * altura }]}>
              {rotuloReferencia ? <Text style={estilos.textoReferencia}>{rotuloReferencia}</Text> : null}
            </View>
          ) : null}
        </View>
        <View style={estilos.barras} onLayout={aoMedir}>
          {dados.map((item) => (
            <BarraMemo
              key={item.chave}
              item={item}
              altura={altura}
              topo={topo}
              selecionada={item.chave === selecionada}
              aoSelecionar={aoSelecionar}
              corDestaque={corDestaque}
            />
          ))}
        </View>
        <View style={estilos.linhaRotulos} pointerEvents="none">
          {largura > 0 && dados.map((item, indice) => {
            const visivel = indice % intervaloRotulos === 0 || item.chave === selecionada;
            if (!visivel) return null;
            const centro = indice * (larguraColuna + ESPACO_ENTRE_BARRAS) + larguraColuna / 2;
            return (
              <Text
                key={item.chave}
                numberOfLines={1}
                style={[estilos.rotulo, { left: centro - LARGURA_ROTULO / 2 }, item.chave === selecionada && estilos.rotuloSelecionado]}
              >
                {item.rotulo}
              </Text>
            );
          })}
        </View>
      </View>
      <View style={[estilos.eixo, { height: altura }]}>
        {marcas.map((marca, i) => (
          <Text key={marca} style={[estilos.textoEixo, { top: (i / (marcas.length - 1)) * altura - 8 }]} numberOfLines={1}>
            {formatarEixo(marca)}
          </Text>
        ))}
      </View>
    </View>
  );
});

const estilos = StyleSheet.create({
  raiz: { flexDirection: 'row', gap: espaco.sm },
  grafico: { flex: 1 },
  grade: { position: 'absolute', left: 0, right: 0, top: 0, justifyContent: 'space-between' },
  linhaGrade: { height: 1, backgroundColor: cores.borda },
  referencia: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: cores.perigo },
  textoReferencia: { position: 'absolute', right: 0, top: -18, fontSize: 11, color: cores.perigo, fontWeight: '600' },
  barras: { flexDirection: 'row', alignItems: 'flex-end', gap: ESPACO_ENTRE_BARRAS },
  coluna: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  barra: { width: '78%', maxWidth: 56, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  futuro: { borderWidth: 1, borderColor: cores.borda, borderStyle: 'dashed' },
  linhaRotulos: { height: 26 },
  rotulo: { position: 'absolute', top: espaco.sm, width: LARGURA_ROTULO, textAlign: 'center', fontSize: 13, color: cores.textoSecundario },
  rotuloSelecionado: { color: cores.texto, fontWeight: '700' },
  eixo: { width: 46 },
  textoEixo: { position: 'absolute', left: 0, fontSize: 12, lineHeight: 16, color: cores.textoSecundario },
});
