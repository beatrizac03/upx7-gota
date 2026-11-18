import { StyleSheet, Text, View } from 'react-native';
import { Cabecalho, GrupoLista, ItemLista, Tela } from '../../componentes';
import { useResumo } from '../../consultas';
import { useSessao } from '../../contexto/SessaoContexto';
import { API_URL } from '../../config';
import { cores, espaco, raio } from '../../tema';

export function MaisTela({ navigation }) {
  const { usuario, residencia, sair } = useSessao();
  const { data: resumo } = useResumo();
  const naoLidos = resumo?.alertasNaoLidos ?? 0;
  const iniciais = (usuario?.nome ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Tela>
      <Cabecalho titulo="Mais" voltar={false} />
      <View style={estilos.perfil}>
        <View style={estilos.avatar}><Text style={estilos.iniciais}>{iniciais}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={estilos.nome}>{usuario?.nome}</Text>
          <Text style={estilos.email}>{usuario?.email}</Text>
        </View>
      </View>

      <GrupoLista>
        <ItemLista icone="person-circle-outline" rotulo="Perfil e residência" aoPressionar={() => navigation.navigate('Perfil')} />
        <ItemLista icone="bullseye-arrow" familia="mci" rotulo="Sua meta" valor={`${residencia?.metaDiariaLitros} L`} aoPressionar={() => navigation.navigate('SuaMeta')} />
        <ItemLista icone="earth-outline" corIcone={cores.sucesso} rotulo="Sua casa em perspectiva" aoPressionar={() => navigation.navigate('Perspectiva')} />
        <ItemLista icone="notifications-outline" rotulo="Alertas" valor={naoLidos ? `${naoLidos} novos` : undefined} aoPressionar={() => navigation.navigate('Alertas')} />
        <ItemLista icone="camera-outline" rotulo="Conectar medidor" aoPressionar={() => navigation.navigate('ConectarMedidor')} ultimo />
      </GrupoLista>

      <GrupoLista>
        <ItemLista icone="log-out-outline" rotulo="Sair da conta" aoPressionar={sair} destrutivo ultimo />
      </GrupoLista>

      <Text style={estilos.rodape}>Gota · protótipo UPX 7 (ODS 6){'\n'}API: {API_URL}</Text>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  perfil: { flexDirection: 'row', alignItems: 'center', gap: espaco.lg, padding: espaco.xl, backgroundColor: cores.superficie, borderRadius: raio.lg, borderWidth: 1, borderColor: cores.borda },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: cores.primariaSuave, alignItems: 'center', justifyContent: 'center' },
  iniciais: { fontSize: 20, fontWeight: '700', color: cores.primariaTexto },
  nome: { fontSize: 19, fontWeight: '700', color: cores.texto },
  email: { fontSize: 15, color: cores.textoSecundario },
  rodape: { fontSize: 12, color: cores.textoTerciario, textAlign: 'center', marginTop: espaco.lg },
});
