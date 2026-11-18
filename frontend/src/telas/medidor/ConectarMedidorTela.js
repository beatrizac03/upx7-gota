import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AvisoInfo, Botao, Cabecalho, CampoTexto, Cartao, IconeSuave, OpcoesSegmentadas, Passos, Tela,
} from '../../componentes';
import { residenciaApi } from '../../api/endpoints';
import { useParearDispositivo } from '../../consultas';
import { cores, espaco, raio } from '../../tema';

// No protótipo a busca de redes é simulada; no leitor real ela viria do ESP32 pela rede "Gota-Setup".
const REDES_PROXIMAS = [
  { nome: 'MinhaCasa_2.4G', sinal: 'wifi' },
  { nome: 'MinhaCasa_5G', sinal: 'wifi' },
  { nome: 'Rede_Vizinho', sinal: 'wifi-outline' },
];

const TIPOS_LEITOR = [
  { valor: 'simulado', rotulo: 'Simulado (protótipo)' },
  { valor: 'camera', rotulo: 'Leitor com câmera' },
];

const MENSAGENS_CONEXAO = [
  'Enviando a rede Wi-Fi para o leitor…',
  'Leitor conectando à internet…',
  'Registrando o leitor na sua conta…',
];

/**
 * Pareamento do leitor Gota: rede "Gota-Setup" → Wi-Fi de casa → registro.
 * As etapas de rádio são simuladas; o registro do dispositivo é real (POST /dispositivos)
 * e devolve a chave usada pelo leitor/simulador para enviar leituras.
 */
export function ConectarMedidorTela({ navigation, route }) {
  const { cadastroInicial = false, residencia } = route.params ?? {};
  const [etapa, setEtapa] = useState('inicio');
  const [rede, setRede] = useState(null);
  const [senhaWifi, setSenhaWifi] = useState('');
  const [tipo, setTipo] = useState('simulado');
  const [mensagem, setMensagem] = useState(0);
  const [pulando, setPulando] = useState(false);
  const parear = useParearDispositivo();

  useEffect(() => {
    if (etapa !== 'conectando') return undefined;
    let cancelado = false;
    const temporizadores = MENSAGENS_CONEXAO.map((_, i) => setTimeout(() => !cancelado && setMensagem(i), i * 900));
    const registro = setTimeout(() => {
      parear.mutate(
        { nome: 'Leitor Gota', tipo },
        { onSuccess: () => setEtapa('pronto'), onError: () => setEtapa('wifi') },
      );
    }, MENSAGENS_CONEXAO.length * 900);
    return () => { cancelado = true; temporizadores.forEach(clearTimeout); clearTimeout(registro); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa]);

  const concluir = () => {
    if (cadastroInicial) navigation.navigate('SuaMeta', { cadastroInicial: true, residencia });
    else navigation.goBack();
  };

  async function pular() {
    setPulando(true);
    try {
      const atualizada = await residenciaApi.atualizar({ possuiHidrometroIndividual: false });
      navigation.navigate('SuaMeta', { cadastroInicial: true, residencia: atualizada });
    } finally {
      setPulando(false);
    }
  }

  return (
    <Tela formulario decorada>
      {cadastroInicial && <Passos atual={2} total={3} />}
      <Cabecalho titulo="Conectar medidor" voltar={etapa === 'inicio'} subtitulo={etapa === 'inicio' ? 'O leitor Gota lê o hidrômetro sozinho e envia o consumo pela internet.' : undefined} />

      {etapa === 'inicio' && (
        <>
          <Cartao>
            <View style={estilos.centro}>
              <IconeSuave nome="camera-outline" tamanho={88} redondo />
            </View>
            {[
              'Encaixe o leitor sobre o vidro do hidrômetro. Ele não abre nem fura o medidor.',
              'Ligue o leitor. Ele cria uma rede Wi-Fi chamada "Gota-Setup".',
              'Siga os passos para conectá-lo ao Wi-Fi da sua casa.',
            ].map((texto, i) => (
              <View key={i} style={estilos.passo}>
                <View style={estilos.numero}><Text style={estilos.textoNumero}>{i + 1}</Text></View>
                <Text style={estilos.textoPasso}>{texto}</Text>
              </View>
            ))}
          </Cartao>
          <Botao titulo="Conectar medidor" icone="wifi" aoPressionar={() => setEtapa('rede-setup')} />
          {cadastroInicial && (
            <Botao titulo="Pular, meu imóvel não tem hidrômetro individual" variante="texto" carregando={pulando} aoPressionar={pular} />
          )}
        </>
      )}

      {etapa === 'rede-setup' && (
        <>
          <Cartao>
            <Text style={estilos.tituloEtapa}>Conecte o celular à rede do leitor</Text>
            <Text style={estilos.textoPasso}>Abra as configurações de Wi-Fi do celular e escolha a rede abaixo. Depois volte para o Gota.</Text>
            <View style={estilos.redeSetup}>
              <Ionicons name="wifi" size={24} color={cores.primaria} />
              <Text style={estilos.nomeRede}>Gota-Setup</Text>
              <Text style={estilos.legenda}>sem senha</Text>
            </View>
          </Cartao>
          <Botao titulo="Já conectei" aoPressionar={() => setEtapa('wifi')} />
          <Botao titulo="Voltar" variante="texto" aoPressionar={() => setEtapa('inicio')} />
        </>
      )}

      {etapa === 'wifi' && (
        <>
          <Text style={estilos.tituloEtapa}>Escolha o Wi-Fi da sua casa</Text>
          <View style={estilos.listaRedes}>
            {REDES_PROXIMAS.map((r) => (
              <Pressable
                key={r.nome}
                onPress={() => setRede(r.nome)}
                accessibilityRole="radio"
                accessibilityState={{ checked: rede === r.nome }}
                style={[estilos.rede, rede === r.nome && estilos.redeAtiva]}
              >
                <Ionicons name={r.sinal} size={22} color={cores.texto} />
                <Text style={estilos.textoRede}>{r.nome}</Text>
                {rede === r.nome && <Ionicons name="checkmark-circle" size={22} color={cores.primaria} />}
              </Pressable>
            ))}
          </View>
          {rede && (
            <CampoTexto rotulo={`Senha de ${rede}`} icone="lock-closed-outline" senha value={senhaWifi} onChangeText={setSenhaWifi} placeholder="Senha do Wi-Fi" />
          )}
          <View style={{ gap: espaco.sm }}>
            <Text style={estilos.rotulo}>Tipo de leitor</Text>
            <OpcoesSegmentadas opcoes={TIPOS_LEITOR} valor={tipo} aoMudar={setTipo} compacto />
          </View>
          {parear.isError && <Text style={estilos.erro}>{parear.error.message}</Text>}
          <AvisoInfo texto="Se o Wi-Fi não alcançar o hidrômetro, use um repetidor perto dele. O leitor guarda as leituras e envia quando a conexão voltar." />
          <Botao titulo="Conectar" aoPressionar={() => setEtapa('conectando')} desabilitado={!rede || senhaWifi.length < 8} />
          {rede && senhaWifi.length > 0 && senhaWifi.length < 8 && <Text style={estilos.legenda}>Senhas de Wi-Fi têm pelo menos 8 caracteres.</Text>}
        </>
      )}

      {etapa === 'conectando' && (
        <View style={[estilos.centro, estilos.conectando]}>
          <ActivityIndicator size="large" color={cores.primaria} />
          <Text style={estilos.tituloEtapa}>{MENSAGENS_CONEXAO[mensagem]}</Text>
        </View>
      )}

      {etapa === 'pronto' && parear.data && (
        <>
          <Cartao tom="sucesso">
            <View style={estilos.centro}>
              <Ionicons name="checkmark-circle" size={64} color={cores.sucesso} />
              <Text style={estilos.tituloEtapa}>Medidor conectado!</Text>
              <Text style={[estilos.textoPasso, { textAlign: 'center' }]}>As leituras vão chegar sozinhas, algumas vezes por dia.</Text>
            </View>
          </Cartao>
          <Cartao titulo="Dados do leitor">
            <Text style={estilos.legenda}>Identificador</Text>
            <Text style={estilos.codigo} selectable>{parear.data.id}</Text>
            <Text style={estilos.legenda}>Chave secreta (aparece só agora)</Text>
            <Text style={estilos.codigo} selectable>{parear.data.chave}</Text>
            {parear.data.tipo === 'simulado' && (
              <>
                <Text style={estilos.legenda}>Para simular este leitor, rode na pasta backend:</Text>
                <Text style={estilos.codigo} selectable>
                  npm run simulador -- --dispositivo={parear.data.id} --chave={parear.data.chave}
                </Text>
              </>
            )}
          </Cartao>
          <Botao titulo="Continuar" aoPressionar={concluir} />
        </>
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  centro: { alignItems: 'center', gap: espaco.md },
  conectando: { paddingVertical: 80 },
  passo: { flexDirection: 'row', gap: espaco.md, alignItems: 'flex-start' },
  numero: { width: 28, height: 28, borderRadius: 14, backgroundColor: cores.primariaSuave, alignItems: 'center', justifyContent: 'center' },
  textoNumero: { fontWeight: '700', color: cores.primariaTexto },
  textoPasso: { flex: 1, fontSize: 16, lineHeight: 23, color: cores.textoSecundario },
  tituloEtapa: { fontSize: 20, fontWeight: '700', color: cores.texto, textAlign: 'center' },
  redeSetup: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, padding: espaco.lg, borderRadius: raio.md, backgroundColor: cores.primariaSuave },
  nomeRede: { flex: 1, fontSize: 18, fontWeight: '700', color: cores.texto },
  listaRedes: { backgroundColor: cores.superficie, borderRadius: raio.lg, borderWidth: 1, borderColor: cores.borda, overflow: 'hidden' },
  rede: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, padding: espaco.lg, borderBottomWidth: 1, borderBottomColor: cores.borda },
  redeAtiva: { backgroundColor: cores.primariaSuave },
  textoRede: { flex: 1, fontSize: 17, color: cores.texto },
  rotulo: { fontSize: 15, fontWeight: '600', color: cores.texto },
  legenda: { fontSize: 14, color: cores.textoSecundario },
  codigo: { fontFamily: 'monospace', fontSize: 14, color: cores.texto, backgroundColor: cores.campo, padding: espaco.md, borderRadius: raio.sm },
  erro: { color: cores.perigo, fontSize: 15 },
});
