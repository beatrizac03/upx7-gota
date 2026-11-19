import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Botao, Cartao, Etiqueta, IconeSuave, OpcoesSegmentadas } from '../../componentes';
import { useAlterarSimulacao, useIniciarSimulacao, usePararSimulacao, useSimulacao } from '../../consultas';
import { formatarDataHora } from '../../utils/formatar';
import { cores, espaco, raio } from '../../tema';

const CENARIOS = [
  { valor: 'normal', rotulo: 'Normal', icone: 'water-outline', dica: 'Consumo comum de uma casa com 4 pessoas (~400 L/dia). Veja o "Consumo hoje" subir no Início.' },
  { valor: 'pico', rotulo: 'Pico', icone: 'trending-up', dica: 'Consumo quase dobra e passa da meta diária: chega o alerta "Consumo acima da meta".' },
  { valor: 'vazamento', rotulo: 'Vazamento', icone: 'warning-outline', dica: 'Água correndo sem parar. O alerta "Possível vazamento" aparece quando o relógio simulado passa das 5h (use a velocidade Rápida).' },
  { valor: 'offline', rotulo: 'Sem Wi-Fi', icone: 'cloud-offline-outline', dica: 'O leitor guarda as leituras. Após 12 h simuladas chega o alerta "Medidor sem sinal". Volte para Normal e ele envia tudo de uma vez.' },
];

const VELOCIDADES = [
  { valor: 'normal', rotulo: 'Normal' },
  { valor: 'rapida', rotulo: 'Rápida' },
];

/**
 * Controle da simulação do leitor direto no app (sem terminal).
 * A simulação roda no servidor e usa o mesmo caminho de dados do leitor real.
 */
export const PainelSimulacao = memo(function PainelSimulacao() {
  const simulacao = useSimulacao();
  const iniciar = useIniciarSimulacao();
  const alterar = useAlterarSimulacao();
  const parar = usePararSimulacao();
  const [escolha, setEscolha] = useState({ cenario: 'normal', velocidade: 'normal' });

  const estado = simulacao.data;
  const ativa = Boolean(estado?.ativa);
  const cenario = ativa ? estado.cenario : escolha.cenario;
  const velocidade = ativa ? estado.velocidade : escolha.velocidade;
  const dica = CENARIOS.find((c) => c.valor === cenario)?.dica;
  const descricaoVelocidade = estado?.velocidades?.find((v) => v.valor === velocidade)?.descricao;
  const erro = iniciar.error ?? alterar.error ?? parar.error;

  // Com a simulação ligada, trocar cenário/velocidade vale na hora
  const mudar = (campo) => (valor) => {
    setEscolha((atual) => ({ ...atual, [campo]: valor }));
    if (ativa) alterar.mutate({ [campo]: valor });
  };

  return (
    <Cartao>
      <View style={estilos.linha}>
        <IconeSuave nome="flask-outline" tamanho={48} />
        <View style={estilos.flex}>
          <Text style={estilos.titulo}>Simulação do leitor</Text>
          <Text style={estilos.legenda}>Sem hardware: o Gota imita o leitor e envia leituras como o aparelho real.</Text>
        </View>
        <Etiqueta tom={ativa ? 'sucesso' : 'neutro'} texto={ativa ? 'Ligada' : 'Desligada'} />
      </View>

      <Text style={estilos.rotulo}>O que simular</Text>
      <View style={estilos.grade}>
        {CENARIOS.map((c) => {
          const selecionado = c.valor === cenario;
          return (
            <Pressable
              key={c.valor}
              onPress={() => mudar('cenario')(c.valor)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selecionado }}
              style={[estilos.opcao, selecionado && estilos.opcaoAtiva]}
            >
              <Ionicons name={c.icone} size={20} color={selecionado ? cores.primariaTexto : cores.textoSecundario} />
              <Text style={[estilos.textoOpcao, selecionado && estilos.textoOpcaoAtiva]}>{c.rotulo}</Text>
            </Pressable>
          );
        })}
      </View>
      {dica ? <Text style={estilos.dica}>{dica}</Text> : null}

      <Text style={estilos.rotulo}>Velocidade</Text>
      <OpcoesSegmentadas opcoes={VELOCIDADES} valor={velocidade} aoMudar={mudar('velocidade')} compacto />
      {descricaoVelocidade ? <Text style={estilos.legenda}>{descricaoVelocidade}</Text> : null}

      {ativa && (
        <View style={estilos.status} accessibilityLiveRegion="polite">
          <Ionicons name="time-outline" size={18} color={cores.primaria} />
          <Text style={estilos.textoStatus}>
            Relógio simulado: {formatarDataHora(estado.relogioSimulado)} · {estado.leiturasEnviadas} enviadas
            {estado.leiturasGuardadas ? ` · ${estado.leiturasGuardadas} guardadas sem Wi-Fi` : ''}
          </Text>
        </View>
      )}
      {erro ? <Text style={estilos.erro}>{erro.message}</Text> : null}
      {estado?.ultimoErro ? <Text style={estilos.erro}>Última leitura recusada: {estado.ultimoErro}</Text> : null}

      {ativa ? (
        <Botao titulo="Desligar simulação" variante="perigo" icone="stop-circle-outline" aoPressionar={() => parar.mutate()} carregando={parar.isPending} />
      ) : (
        <Botao titulo="Ligar simulação" icone="play" aoPressionar={() => iniciar.mutate(escolha)} carregando={iniciar.isPending} desabilitado={simulacao.isPending} />
      )}
      {ativa && <Text style={estilos.nota}>Desliga sozinha após 30 minutos. Os dados aparecem no Início, Histórico e Alertas.</Text>}
    </Cartao>
  );
});

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  flex: { flex: 1, gap: 2 },
  titulo: { fontSize: 18, fontWeight: '700', color: cores.texto },
  legenda: { fontSize: 13, color: cores.textoSecundario, lineHeight: 18 },
  rotulo: { fontSize: 15, fontWeight: '600', color: cores.texto, marginTop: espaco.xs },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  opcao: {
    flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: espaco.sm,
    padding: espaco.md, borderRadius: raio.md, borderWidth: 1.5, borderColor: cores.borda, backgroundColor: cores.superficie,
  },
  opcaoAtiva: { borderColor: cores.primariaClara, backgroundColor: cores.primariaSuave },
  textoOpcao: { fontSize: 15, fontWeight: '500', color: cores.textoSecundario },
  textoOpcaoAtiva: { color: cores.primariaTexto, fontWeight: '700' },
  dica: { fontSize: 14, color: cores.texto, lineHeight: 20, backgroundColor: cores.fundo, padding: espaco.md, borderRadius: raio.md },
  status: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm, backgroundColor: cores.primariaSuave, padding: espaco.md, borderRadius: raio.md },
  textoStatus: { flex: 1, fontSize: 14, color: cores.primariaTexto, fontWeight: '600' },
  erro: { fontSize: 14, color: cores.perigo },
  nota: { fontSize: 12, color: cores.textoTerciario, textAlign: 'center' },
});
