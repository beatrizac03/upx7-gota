import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Botao, Cabecalho, Carregando, Contador, FolhaInferior, GrupoLista, ItemLista, ModalOpcoes, Tela } from '../../componentes';
import { useAtualizarResidencia } from '../../consultas';
import { useSessao } from '../../contexto/SessaoContexto';
import { tarifaApi } from '../../api/endpoints';
import { formatarReais } from '../../utils/formatar';
import { cores, espaco } from '../../tema';

const OPCOES = {
  tipo: { titulo: 'Tipo de residência', opcoes: [{ valor: 'casa', rotulo: 'Casa' }, { valor: 'apartamento', rotulo: 'Apartamento' }] },
  areaExterna: { titulo: 'Possui área externa?', opcoes: [{ valor: true, rotulo: 'Sim', descricao: 'Quintal, jardim ou garagem' }, { valor: false, rotulo: 'Não' }] },
  categoriaTarifaria: {
    titulo: 'Categoria tarifária',
    opcoes: [
      { valor: 'residencial', rotulo: 'Residencial', descricao: 'Tarifa padrão para residências' },
      { valor: 'social', rotulo: 'Residencial Social', descricao: 'Famílias inscritas no CadÚnico' },
    ],
  },
};

const rotuloDe = (campo, valor) => OPCOES[campo].opcoes.find((o) => o.valor === valor)?.rotulo ?? '—';

export function PerfilTela({ navigation }) {
  const { residencia } = useSessao();
  const atualizar = useAtualizarResidencia();
  const [editando, setEditando] = useState(null);
  const [moradores, setMoradores] = useState(residencia.moradores);
  const tabela = useQuery({ queryKey: ['tarifas'], queryFn: tarifaApi.tabela, enabled: editando === 'tarifa', staleTime: Infinity });

  const salvar = (campos) => atualizar.mutate(campos, { onSuccess: () => setEditando(null) });
  const categoria = tabela.data?.categorias?.[residencia.categoriaTarifaria];

  return (
    <Tela>
      <Cabecalho titulo="Perfil" subtitulo="Gerencie suas informações e preferências no Gota." />

      <GrupoLista titulo="Minha residência">
        <ItemLista icone="people-outline" rotulo="Moradores" valor={String(residencia.moradores)} aoPressionar={() => { setMoradores(residencia.moradores); setEditando('moradores'); }} />
        <ItemLista icone="home-outline" corIcone={cores.sucesso} rotulo="Tipo de residência" valor={rotuloDe('tipo', residencia.tipo)} aoPressionar={() => setEditando('tipo')} />
        <ItemLista icone="leaf-outline" corIcone={cores.sucesso} rotulo="Área externa" valor={rotuloDe('areaExterna', residencia.areaExterna)} aoPressionar={() => setEditando('areaExterna')} />
        <ItemLista icone="bullseye-arrow" familia="mci" rotulo="Meta diária" valor={`${residencia.metaDiariaLitros} L`} aoPressionar={() => navigation.navigate('SuaMeta')} ultimo />
      </GrupoLista>

      <GrupoLista titulo="Conta">
        <ItemLista icone="document-text-outline" rotulo="Categoria tarifária" valor={rotuloDe('categoriaTarifaria', residencia.categoriaTarifaria)} aoPressionar={() => setEditando('categoriaTarifaria')} />
        <ItemLista icone="cash-outline" rotulo="Tarifa" valor="Estimativa por faixas" aoPressionar={() => setEditando('tarifa')} />
        <ItemLista icone="notifications-outline" rotulo="Notificações" aoPressionar={() => navigation.navigate('Alertas')} ultimo />
      </GrupoLista>

      {atualizar.isError && <Text style={estilos.erro}>{atualizar.error.message}</Text>}

      {['tipo', 'areaExterna', 'categoriaTarifaria'].map((campo) => (
        <ModalOpcoes
          key={campo}
          visivel={editando === campo}
          titulo={OPCOES[campo].titulo}
          opcoes={OPCOES[campo].opcoes}
          valor={residencia[campo]}
          aoEscolher={(valor) => salvar({ [campo]: valor })}
          aoFechar={() => setEditando(null)}
        />
      ))}

      <FolhaInferior visivel={editando === 'moradores'} titulo="Quantidade de moradores" aoFechar={() => setEditando(null)}>
        <Contador valor={moradores} aoMudar={setMoradores} minimo={1} maximo={20} rotulo="moradores" />
        <Botao titulo="Salvar" aoPressionar={() => salvar({ moradores })} carregando={atualizar.isPending} />
      </FolhaInferior>

      <FolhaInferior visivel={editando === 'tarifa'} titulo="Como estimamos sua conta" aoFechar={() => setEditando(null)}>
        {!categoria ? <Carregando /> : (
          <View style={{ gap: espaco.sm }}>
            <Text style={estilos.texto}>
              Tarifa fixa de água {formatarReais(categoria.tarifaFixaAgua)} + valor por m³ em faixas progressivas. O esgoto custa {Math.round(categoria.percentualEsgoto * 100)}% do valor da água.
            </Text>
            {categoria.faixas.map((faixa, i) => {
              const de = i === 0 ? 0 : categoria.faixas[i - 1].ateM3;
              return (
                <View key={i} style={estilos.faixa}>
                  <Text style={estilos.texto}>{faixa.ateM3 ? `${de} a ${faixa.ateM3} m³` : `acima de ${de} m³`}</Text>
                  <Text style={estilos.valorFaixa}>{formatarReais(faixa.valorM3)}/m³</Text>
                </View>
              );
            })}
            <Text style={estilos.nota}>{tabela.data.fonte}</Text>
          </View>
        )}
      </FolhaInferior>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  erro: { color: cores.perigo, fontSize: 15 },
  texto: { fontSize: 15, color: cores.textoSecundario, lineHeight: 21 },
  faixa: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: cores.borda },
  valorFaixa: { fontSize: 15, fontWeight: '700', color: cores.texto },
  nota: { fontSize: 12, color: cores.textoTerciario, marginTop: espaco.sm },
});
