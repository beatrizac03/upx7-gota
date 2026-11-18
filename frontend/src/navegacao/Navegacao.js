import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';
import { useSessao } from '../contexto/SessaoContexto';
import { ProvedorTempoReal } from '../contexto/TempoRealContexto';
import { Carregando, EstadoErro, GotaLogo, Tela } from '../componentes';
import { referenciaNavegacao } from './referencia';
import { cores } from '../tema';

import { BoasVindasTela } from '../telas/autenticacao/BoasVindasTela';
import { EntrarTela } from '../telas/autenticacao/EntrarTela';
import { CadastroTela } from '../telas/autenticacao/CadastroTela';
import { SuaResidenciaTela } from '../telas/cadastro-inicial/SuaResidenciaTela';
import { ConectarMedidorTela } from '../telas/medidor/ConectarMedidorTela';
import { SuaMetaTela } from '../telas/meta/SuaMetaTela';
import { InicioTela } from '../telas/inicio/InicioTela';
import { HistoricoTela } from '../telas/historico/HistoricoTela';
import { MeuMedidorTela } from '../telas/medidor/MeuMedidorTela';
import { RegistrarLeituraTela } from '../telas/medidor/RegistrarLeituraTela';
import { DicasTela } from '../telas/dicas/DicasTela';
import { MaisTela } from '../telas/mais/MaisTela';
import { PerfilTela } from '../telas/mais/PerfilTela';
import { PerspectivaTela } from '../telas/mais/PerspectivaTela';
import { AlertasTela } from '../telas/alertas/AlertasTela';

const Pilha = createNativeStackNavigator();
const Abas = createBottomTabNavigator();

const temaNavegacao = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: cores.fundo, primary: cores.primaria } };
const semCabecalho = { headerShown: false, contentStyle: { backgroundColor: cores.fundo } };

const ICONES_ABAS = {
  Inicio: 'home',
  Historico: 'stats-chart',
  Medidor: 'speedometer',
  Dicas: 'bulb',
  Mais: 'menu',
};

function AbasPrincipais() {
  return (
    <Abas.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: cores.primariaTexto,
        tabBarInactiveTintColor: cores.textoSecundario,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: estilos.barraAbas,
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={focused ? ICONES_ABAS[route.name] : `${ICONES_ABAS[route.name]}-outline`} size={size} color={color} />
        ),
      })}
    >
      <Abas.Screen name="Inicio" component={InicioTela} options={{ title: 'Início' }} />
      <Abas.Screen name="Historico" component={HistoricoTela} options={{ title: 'Histórico' }} />
      <Abas.Screen name="Medidor" component={MeuMedidorTela} options={{ title: 'Medidor' }} />
      <Abas.Screen name="Dicas" component={DicasTela} />
      <Abas.Screen name="Mais" component={MaisTela} />
    </Abas.Navigator>
  );
}

function TelaAbertura() {
  return (
    <Tela rolavel={false} decorada estiloConteudo={estilos.abertura}>
      <View style={estilos.centro}>
        <GotaLogo tamanho={96} />
        <Carregando />
      </View>
    </Tela>
  );
}

/**
 * Três fluxos, decididos pela sessão:
 * 1. sem login → boas-vindas / entrar / cadastro;
 * 2. logado sem residência → cadastro inicial (residência → medidor → meta);
 * 3. completo → app com abas + tempo real.
 */
export function Navegacao() {
  const { carregando, erroInicial, token, residencia, restaurar } = useSessao();

  if (carregando) return <TelaAbertura />;
  if (erroInicial) {
    return (
      <Tela rolavel={false} estiloConteudo={estilos.abertura}>
        <EstadoErro erro={erroInicial} aoTentarNovamente={restaurar} />
      </Tela>
    );
  }

  // A key recria o container ao trocar de fluxo. Sem ela, o React Navigation reaproveita o
  // estado anterior e, como "SuaMeta"/"ConectarMedidor" existem nos dois fluxos, o usuário
  // continuava preso na tela de meta do cadastro inicial depois de salvar.
  const fluxo = !token ? 'autenticacao' : !residencia ? 'cadastro-inicial' : 'app';

  return (
    <NavigationContainer key={fluxo} ref={referenciaNavegacao} theme={temaNavegacao}>
      {!token ? (
        <Pilha.Navigator screenOptions={semCabecalho}>
          <Pilha.Screen name="BoasVindas" component={BoasVindasTela} />
          <Pilha.Screen name="Entrar" component={EntrarTela} />
          <Pilha.Screen name="Cadastro" component={CadastroTela} />
        </Pilha.Navigator>
      ) : !residencia ? (
        <Pilha.Navigator screenOptions={semCabecalho}>
          <Pilha.Screen name="SuaResidencia" component={SuaResidenciaTela} />
          <Pilha.Screen name="ConectarMedidor" component={ConectarMedidorTela} initialParams={{ cadastroInicial: true }} />
          <Pilha.Screen name="SuaMeta" component={SuaMetaTela} initialParams={{ cadastroInicial: true }} />
        </Pilha.Navigator>
      ) : (
        <ProvedorTempoReal token={token}>
          <Pilha.Navigator screenOptions={semCabecalho}>
            <Pilha.Screen name="Abas" component={AbasPrincipais} />
            <Pilha.Screen name="Alertas" component={AlertasTela} />
            <Pilha.Screen name="Perfil" component={PerfilTela} />
            <Pilha.Screen name="Perspectiva" component={PerspectivaTela} />
            <Pilha.Screen name="SuaMeta" component={SuaMetaTela} />
            <Pilha.Screen name="ConectarMedidor" component={ConectarMedidorTela} />
            <Pilha.Screen name="RegistrarLeitura" component={RegistrarLeituraTela} />
          </Pilha.Navigator>
        </ProvedorTempoReal>
      )}
    </NavigationContainer>
  );
}

const estilos = StyleSheet.create({
  abertura: { justifyContent: 'center' },
  centro: { alignItems: 'center', gap: 8 },
  barraAbas: {
    borderTopColor: cores.borda,
    backgroundColor: cores.superficie,
    // No navegador não há área segura inferior: dá espaço explícito para ícone + rótulo
    ...(Platform.OS === 'web' && { height: 64, paddingBottom: 8 }),
  },
});
