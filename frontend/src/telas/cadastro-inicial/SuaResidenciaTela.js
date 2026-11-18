import { useState } from 'react';
import { Text } from 'react-native';
import { AvisoInfo, Botao, Cabecalho, CartaoCampo, Contador, OpcoesSegmentadas, Passos, Tela } from '../../componentes';
import { residenciaApi } from '../../api/endpoints';
import { useSessao } from '../../contexto/SessaoContexto';
import { cores } from '../../tema';

const TIPOS = [{ valor: 'casa', rotulo: 'Casa' }, { valor: 'apartamento', rotulo: 'Apartamento' }];
const SIM_NAO = [{ valor: true, rotulo: 'Sim' }, { valor: false, rotulo: 'Não' }];

/** Passo 1 do cadastro inicial. */
export function SuaResidenciaTela({ navigation }) {
  const { usuario, sair } = useSessao();
  const [dados, setDados] = useState({ moradores: 4, tipo: 'casa', areaExterna: true });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const alterar = (campo) => (valor) => setDados((atual) => ({ ...atual, [campo]: valor }));

  async function continuar() {
    setEnviando(true);
    setErro('');
    try {
      // A meta diária é sugerida pelo servidor a partir dos moradores (ajustável no passo 3)
      const residencia = await residenciaApi.criar(dados).catch((e) => {
        if (e.codigo === 'RESIDENCIA_JA_CADASTRADA') return residenciaApi.atualizar(dados);
        throw e;
      });
      navigation.navigate('ConectarMedidor', { cadastroInicial: true, residencia });
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela decorada>
      <Passos atual={1} total={3} />
      <Cabecalho
        voltar={false}
        titulo="Sua residência"
        subtitulo={`${usuario?.nome ? `${usuario.nome.split(' ')[0]}, essas` : 'Essas'} informações nos ajudam a personalizar sua experiência e estimar sua conta.`}
      />
      <CartaoCampo icone="people-outline" rotulo="Quantidade de moradores">
        <Contador valor={dados.moradores} aoMudar={alterar('moradores')} minimo={1} maximo={20} rotulo="moradores" />
      </CartaoCampo>
      <CartaoCampo icone="home-outline" rotulo="Tipo de residência">
        <OpcoesSegmentadas opcoes={TIPOS} valor={dados.tipo} aoMudar={alterar('tipo')} compacto />
      </CartaoCampo>
      <CartaoCampo icone="leaf-outline" rotulo="Possui área externa?">
        <OpcoesSegmentadas opcoes={SIM_NAO} valor={dados.areaExterna} aoMudar={alterar('areaExterna')} compacto />
      </CartaoCampo>
      <AvisoInfo texto="Usamos seu consumo em litros para calcular uma estimativa em R$ com base na tarifa residencial." />
      {erro ? <Text style={{ color: cores.perigo, fontSize: 15 }}>{erro}</Text> : null}
      <Botao titulo="Continuar" aoPressionar={continuar} carregando={enviando} />
      <Botao titulo="Sair" variante="texto" aoPressionar={sair} />
    </Tela>
  );
}
