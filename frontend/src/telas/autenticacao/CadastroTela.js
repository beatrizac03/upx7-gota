import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Botao, Cabecalho, CampoTexto, Tela } from '../../componentes';
import { useSessao } from '../../contexto/SessaoContexto';
import { cores, espaco, raio } from '../../tema';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validar({ nome, email, senha }) {
  const erros = {};
  if (nome.trim().length < 2) erros.nome = 'Como podemos te chamar?';
  if (!EMAIL_VALIDO.test(email.trim())) erros.email = 'Informe um e-mail válido.';
  if (senha.length < 6) erros.senha = 'Use pelo menos 6 caracteres.';
  return erros;
}

export function CadastroTela({ navigation }) {
  const { cadastrar } = useSessao();
  const [campos, setCampos] = useState({ nome: '', email: '', senha: '' });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);
  const campoEmail = useRef(null);
  const campoSenha = useRef(null);

  const alterar = (campo) => (valor) => {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
    if (erros[campo]) setErros((atual) => ({ ...atual, [campo]: undefined }));
    setErroGeral('');
  };

  async function enviar() {
    const encontrados = validar(campos);
    setErros(encontrados);
    if (Object.keys(encontrados).length) return;
    setEnviando(true);
    try {
      await cadastrar({ nome: campos.nome.trim(), email: campos.email.trim().toLowerCase(), senha: campos.senha });
    } catch (erro) {
      setErroGeral(erro.message);
      setEnviando(false);
    }
  }

  return (
    <Tela formulario decorada>
      <Cabecalho titulo="Criar conta" subtitulo="Leva menos de um minuto. Depois vamos conhecer sua casa." />
      <CampoTexto
        rotulo="Nome"
        icone="person-outline"
        placeholder="Seu nome"
        value={campos.nome}
        onChangeText={alterar('nome')}
        erro={erros.nome}
        autoComplete="name"
        textContentType="givenName"
        returnKeyType="next"
        onSubmitEditing={() => campoEmail.current?.focus()}
        submitBehavior="submit"
      />
      <CampoTexto
        ref={campoEmail}
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
        returnKeyType="next"
        onSubmitEditing={() => campoSenha.current?.focus()}
        submitBehavior="submit"
      />
      <CampoTexto
        ref={campoSenha}
        rotulo="Senha"
        icone="lock-closed-outline"
        placeholder="Mínimo de 6 caracteres"
        value={campos.senha}
        onChangeText={alterar('senha')}
        erro={erros.senha}
        senha
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={enviar}
      />

      {erroGeral ? (
        <View style={estilos.erroGeral}>
          <Ionicons name="alert-circle" size={20} color={cores.perigo} />
          <Text style={estilos.textoErro}>{erroGeral}</Text>
        </View>
      ) : null}

      <Botao titulo="Criar conta" aoPressionar={enviar} carregando={enviando} estilo={{ marginTop: espaco.sm }} />
      <Botao titulo="Já tenho conta" variante="texto" aoPressionar={() => navigation.replace('Entrar')} />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  erroGeral: { flexDirection: 'row', gap: espaco.sm, alignItems: 'center', backgroundColor: cores.perigoSuave, padding: espaco.md, borderRadius: raio.md },
  textoErro: { flex: 1, color: cores.perigo, fontSize: 15 },
});
