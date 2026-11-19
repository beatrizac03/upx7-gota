import { useCallback, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Botao, FundoDecorativo, GotaLogo, IconeSuave } from '../../componentes';
import { cores, espaco } from '../../tema';
import { SafeAreaView } from 'react-native-safe-area-context';

const SLIDES = [
  { chave: 'marca' },
  {
    chave: 'leitor',
    icone: 'camera-outline',
    tom: 'info',
    titulo: 'Leitura automática',
    texto: 'O leitor Gota fica sobre o vidro do hidrômetro, lê os números e envia o consumo sozinho. Sem digitar nada.',
  },
  {
    chave: 'alertas',
    icone: 'water',
    tom: 'perigo',
    titulo: 'Vazamento? Você fica sabendo',
    texto: 'Água correndo de madrugada, consumo acima da meta ou medidor sem sinal: o Gota avisa na hora.',
  },
];

export function BoasVindasTela({ navigation }) {
  const { width } = useWindowDimensions();
  const [indice, setIndice] = useState(0);
  const lista = useRef(null);

  // onScroll funciona no celular e no navegador (onMomentumScrollEnd não dispara na web)
  const aoRolar = useCallback((e) => {
    const atual = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndice((anterior) => (anterior === atual ? anterior : atual));
  }, [width]);

  const renderizar = useCallback(({ item }) => (
    <View style={[estilos.slide, { width }]}>
      {item.chave === 'marca' ? (
        <>
          <GotaLogo tamanho={130} />
          <Text style={estilos.marca}>gota</Text>
          <Text style={estilos.lema}>Sua casa,{'\n'}mais consciente,{'\n'}todo dia.</Text>
        </>
      ) : (
        <>
          <IconeSuave nome={item.icone} tom={item.tom} tamanho={120} redondo />
          <Text style={estilos.titulo}>{item.titulo}</Text>
          <Text style={estilos.texto}>{item.texto}</Text>
        </>
      )}
    </View>
  ), [width]);

  const avancar = () => {
    if (indice >= SLIDES.length - 1) return navigation.navigate('Cadastro');
    const proximo = indice + 1;
    // Atualiza o índice já no clique: não depende do evento de rolagem chegar
    setIndice(proximo);
    lista.current?.scrollToOffset({ offset: proximo * width, animated: true });
  };

  return (
    <SafeAreaView style={estilos.raiz}>
      <FundoDecorativo />
      <FlatList
        ref={lista}
        data={SLIDES}
        keyExtractor={(s) => s.chave}
        renderItem={renderizar}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={aoRolar}
        scrollEventThrottle={32}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
      />
      <View style={estilos.pontos} accessibilityLabel={`Página ${indice + 1} de ${SLIDES.length}`}>
        {SLIDES.map((s, i) => <View key={s.chave} style={[estilos.ponto, i === indice && estilos.pontoAtivo]} />)}
      </View>
      <View style={estilos.acoes}>
        <Botao titulo={indice < SLIDES.length - 1 ? 'Começar' : 'Criar minha conta'} aoPressionar={avancar} />
        <Botao titulo="Já tenho conta" variante="texto" aoPressionar={() => navigation.navigate('Entrar')} />
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: espaco.xxxl, gap: espaco.lg },
  marca: { fontSize: 88, fontWeight: '500', color: '#0E2A55', letterSpacing: -2, marginTop: -espaco.md },
  lema: { fontSize: 24, lineHeight: 32, color: cores.textoSecundario, textAlign: 'center' },
  titulo: { fontSize: 28, fontWeight: '800', color: cores.texto, textAlign: 'center', marginTop: espaco.lg },
  texto: { fontSize: 18, lineHeight: 26, color: cores.textoSecundario, textAlign: 'center' },
  pontos: { flexDirection: 'row', justifyContent: 'center', gap: espaco.md, marginVertical: espaco.xl },
  ponto: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#CFE3F6' },
  pontoAtivo: { backgroundColor: cores.primariaClara },
  acoes: { paddingHorizontal: espaco.xl, paddingBottom: espaco.lg, gap: espaco.sm },
});
