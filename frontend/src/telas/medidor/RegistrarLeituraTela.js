import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Botao, Cabecalho, Cartao, DigitosHidrometro, IconeSuave, OpcoesSegmentadas, Tela } from '../../componentes';
import { useRegistrarLeitura, useResumo } from '../../consultas';
import { formatarData, formatarLitros } from '../../utils/formatar';
import { cores, espaco, raio } from '../../tema';

const DIAS = [{ valor: 0, rotulo: 'Hoje' }, { valor: 1, rotulo: 'Ontem' }, { valor: 2, rotulo: 'Anteontem' }];

/**
 * Leitura manual (opção secundária para quem não tem o leitor automático).
 * O mostrador imita o hidrômetro: pretos = m³ (obrigatório), vermelhos = litros (opcional).
 */
export function RegistrarLeituraTela({ navigation }) {
  const [inteiro, setInteiro] = useState('');
  const [fracao, setFracao] = useState('');
  const [diasAtras, setDiasAtras] = useState(0);
  const campoInteiro = useRef(null);
  const campoFracao = useRef(null);
  const resumo = useResumo();
  const registrar = useRegistrarLeitura();

  const leituraM3 = inteiro ? Number(`${inteiro}.${fracao || '0'}`) : null;
  const ultima = resumo.data?.ultimaLeitura;
  const consumoPrevisto = useMemo(
    () => (leituraM3 !== null && ultima ? (leituraM3 - ultima.leituraM3) * 1000 : null),
    [leituraM3, ultima],
  );
  const [abertaEm] = useState(() => Date.now());
  const lidoEm = useMemo(() => new Date(abertaEm - diasAtras * 86_400_000).toISOString(), [abertaEm, diasAtras]);

  const salvar = () =>
    registrar.mutate({ leituraM3, lidoEm: diasAtras ? lidoEm : undefined }, { onSuccess: () => navigation.goBack() });

  return (
    <Tela formulario>
      <Cabecalho titulo="Registrar leitura" subtitulo="Digite os números pretos do seu hidrômetro." />

      <Cartao>
        <Pressable onPress={() => campoInteiro.current?.focus()} accessibilityLabel="Editar números pretos">
          <DigitosHidrometro inteiro={inteiro} fracao={fracao} />
        </Pressable>
        <View style={estilos.entradas}>
          <View style={estilos.flex}>
            <Text style={estilos.rotulo}>Números pretos (m³)</Text>
            <TextInput
              ref={campoInteiro}
              style={estilos.entrada}
              value={inteiro}
              onChangeText={(t) => setInteiro(t.replace(/\D/g, '').slice(0, 5))}
              keyboardType="number-pad"
              placeholder="00000"
              placeholderTextColor={cores.textoTerciario}
              maxLength={5}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => campoFracao.current?.focus()}
            />
          </View>
          <View style={estilos.flexMenor}>
            <Text style={estilos.rotulo}>Vermelhos (opcional)</Text>
            <TextInput
              ref={campoFracao}
              style={[estilos.entrada, { color: cores.perigo }]}
              value={fracao}
              onChangeText={(t) => setFracao(t.replace(/\D/g, '').slice(0, 3))}
              keyboardType="number-pad"
              placeholder="000"
              placeholderTextColor={cores.textoTerciario}
              maxLength={3}
            />
          </View>
        </View>
        <View style={estilos.info}>
          <Ionicons name="information-circle-outline" size={22} color={cores.textoSecundario} />
          <Text style={estilos.legenda}>Os números pretos bastam. Os vermelhos deixam o cálculo mais preciso.</Text>
        </View>
      </Cartao>

      <Cartao>
        <View style={estilos.linha}>
          <Ionicons name="calendar-outline" size={28} color={cores.texto} />
          <View style={estilos.flex}>
            <Text style={estilos.legenda}>Data da leitura</Text>
            <Text style={estilos.data}>{formatarData(lidoEm)}</Text>
          </View>
        </View>
        <OpcoesSegmentadas opcoes={DIAS} valor={diasAtras} aoMudar={setDiasAtras} compacto />
      </Cartao>

      {consumoPrevisto !== null && (
        <Cartao>
          <View style={estilos.linha}>
            <IconeSuave nome="water" tamanho={64} />
            <View style={estilos.flex}>
              <Text style={estilos.legenda}>Consumo desde a última leitura</Text>
              <Text style={[estilos.numero, consumoPrevisto < 0 && { color: cores.perigo }]}>
                {consumoPrevisto < 0 ? 'Leitura menor que a anterior' : formatarLitros(consumoPrevisto)}
              </Text>
              {ultima && <Text style={estilos.legenda}>Anterior: {ultima.leituraM3.toFixed(3).replace('.', ',')} m³</Text>}
            </View>
          </View>
        </Cartao>
      )}

      {registrar.isError && <Text style={estilos.erro}>{registrar.error.message}</Text>}
      <Botao titulo="Salvar leitura" aoPressionar={salvar} carregando={registrar.isPending} desabilitado={leituraM3 === null} />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  entradas: { flexDirection: 'row', gap: espaco.md },
  flex: { flex: 1, gap: 4 },
  flexMenor: { flex: 0.8, gap: 4 },
  rotulo: { fontSize: 13, color: cores.textoSecundario, fontWeight: '600' },
  entrada: { minHeight: 50, borderRadius: raio.md, borderWidth: 1.5, borderColor: cores.borda, paddingHorizontal: espaco.md, fontSize: 20, fontWeight: '700', color: cores.texto, letterSpacing: 2 },
  info: { flexDirection: 'row', gap: espaco.sm, alignItems: 'center' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.lg },
  data: { fontSize: 20, color: cores.texto, fontWeight: '500' },
  numero: { fontSize: 30, fontWeight: '800', color: cores.texto },
  legenda: { flexShrink: 1, fontSize: 15, color: cores.textoSecundario },
  erro: { color: cores.perigo, fontSize: 15 },
});
