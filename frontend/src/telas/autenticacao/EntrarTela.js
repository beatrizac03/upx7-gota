import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Botao, Cabecalho, CampoTexto, GotaLogo, Tela } from '../../componentes';
import { useSessao } from '../../contexto/SessaoContexto';
import { CONTA_DEMO } from '../../config';
import { cores, espaco, raio } from '../../tema';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validar({ email, senha }) {
  const erros = {};
  if (!email.trim()) erros.email = 'Informe seu e-mail.';
  else if (!EMAIL_VALIDO.test(email.trim())) erros.email = 'Esse e-mail não parece válido.';
  if (!senha) erros.senha = 'Informe sua senha.';
  return erros;
}

/**
 * Login pensado para ser rápido: teclado de e-mail, "próximo" leva à senha,
 * "entrar" no teclado envia, erros aparecem no próprio campo e há atalho
 * para a conta de demonstração (útil na apresentação).
 */
export function EntrarTela({ navigation }) {
  const { entrar } = useSessao();
  const [campos, setCampos] = useState({ email: '', senha: '' });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);
  const campoSenha = useRef(null);

  const alterar = (campo) => (valor) => {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
    if (erros[campo]) setErros((atual) => ({ ...atual, [campo]: undefined }));
    setErroGeral('');
  };

  async function enviar(dados = campos) {
    const encontrados = validar(dados);
    setErros(encontrados);
    if (Object.keys(encontrados).length) return;
    setEnviando(true);
    try {
      await entrar(dados.email.trim().toLowerCase(), dados.senha);
    } catch (erro) {
      setErroGeral(erro.message);
      setEnviando(false);
    }
  }

  const usarDemo = () => {
    setCampos(CONTA_DEMO);
    enviar(CONTA_DEMO);
  };

  return (
    <Tela formulario decorada>
      <Cabecalho titulo="" />
      <View style={estilos.topo}>
        <GotaLogo tamanho={64} />
        <Text style={estilos.titulo}>Bem-vindo de volta</Text>
        <Text style={estilos.subtitulo}>Entre para acompanhar o consumo de água da sua casa.</Text>
      </View>

      <CampoTexto
        rotulo="E-mail"
        icone="mail-outline"
        placeholder="voce@email.com"
        value={campos.email}
        onChangeText={alterar('email')}
        erro={erros.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => campoSenha.current?.focus()}
        submitBehavior="submit"
      />
      <CampoTexto
        ref={campoSenha}
        rotulo="Senha"
        icone="lock-closed-outline"
        placeholder="Sua senha"
        value={campos.senha}
        onChangeText={alterar('senha')}
        erro={erros.senha}
        senha
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={() => enviar()}
      />

      {erroGeral ? (
        <View style={estilos.erroGeral} accessibilityLiveRegion="assertive">
          <Ionicons name="alert-circle" size={20} color={cores.perigo} />
          <Text style={estilos.textoErro}>{erroGeral}</Text>
        </View>
      ) : null}

      <Botao titulo="Entrar" aoPressionar={() => enviar()} carregando={enviando} estilo={estilos.botao} />
      <Botao titulo="Usar conta de demonstração" variante="secundario" icone="flash-outline" aoPressionar={usarDemo} desabilitado={enviando} />

      <View style={estilos.rodape}>
        <Text style={estilos.textoRodape}>Ainda não tem conta?</Text>
        <Botao titulo="Criar conta" variante="texto" aoPressionar={() => navigation.replace('Cadastro')} />
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: { alignItems: 'center', gap: espaco.sm, marginBottom: espaco.md },
  titulo: { fontSize: 30, fontWeight: '800', color: cores.texto, marginTop: espaco.sm },
  subtitulo: { fontSize: 16, color: cores.textoSecundario, textAlign: 'center', lineHeight: 22 },
  erroGeral: { flexDirection: 'row', gap: espaco.sm, alignItems: 'center', backgroundColor: cores.perigoSuave, padding: espaco.md, borderRadius: raio.md },
  textoErro: { flex: 1, color: cores.perigo, fontSize: 15 },
  botao: { marginTop: espaco.sm },
  rodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 },
  textoRodape: { fontSize: 16, color: cores.textoSecundario },
});
