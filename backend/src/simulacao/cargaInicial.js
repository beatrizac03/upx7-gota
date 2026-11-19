import { ambiente } from '../config/ambiente.js';
import { adicionarMeses, inicioDaHora, inicioDoDia, paraIsoLocal } from '../utils/datas.js';
import { gerarHistoricoSimulado } from './historicoSimulado.js';

export const DEMO = Object.freeze({
  nome: 'Beatriz',
  email: 'demo@gota.app',
  senha: 'gota123',
  dispositivoId: 'gota-001',
});

/**
 * Cria o usuário de demonstração, a residência, o leitor simulado e ~N meses de
 * leituras de hora em hora (com um vazamento consertado e alguns dias de pico).
 * Usada pelo script `npm run carga-inicial` e pelo servidor (CARGA_INICIAL_AUTOMATICA).
 *
 * @returns {Promise<null | object>} null se a conta demo já existir
 */
export async function executarCargaInicial({ repositorios, servicos }, { meses = 6 } = {}) {
  if (await repositorios.usuarios.buscarPorEmail(DEMO.email)) return null;

  const inicioExecucao = performance.now();
  const { usuario } = await servicos.autenticacao.cadastrar({ nome: DEMO.nome, email: DEMO.email, senha: DEMO.senha });
  const residencia = await servicos.residencia.criar(usuario.id, {
    moradores: 4,
    tipo: 'casa',
    areaExterna: true,
    metaDiariaLitros: 500,
    categoriaTarifaria: 'residencial',
    notificarAcimaMeta: true,
    possuiHidrometroIndividual: true,
  });
  const dispositivo = await servicos.dispositivo.registrar(residencia.id, {
    id: DEMO.dispositivoId,
    nome: 'Leitor Gota',
    tipo: 'simulado',
    chave: ambiente.chaveDispositivoDemo,
  });

  const fim = inicioDaHora(new Date());
  const inicio = inicioDoDia(adicionarMeses(fim, -meses));
  const diasPico = new Set([12, 26, 33, 61, 75, 96, 118, 140]);

  const { quantidade, leituraM3 } = await gerarHistoricoSimulado(
    { repositorios, ingestao: servicos.ingestao },
    dispositivo,
    {
      inicio,
      fim,
      litrosDia: 400,
      leituraInicialM3: 225.613 - 70, // termina perto do valor do exemplo do documento
      cenarioDoDia: (d) => (d >= 47 && d <= 49 ? 'vazamento' : diasPico.has(d) ? 'pico' : 'normal'),
    },
  );

  const { total: alertas } = await repositorios.alertas.listar({ residenciaId: residencia.id }, { limite: 1, deslocamento: 0 });
  return {
    leituras: quantidade,
    alertas,
    inicio: paraIsoLocal(inicio),
    fim: paraIsoLocal(fim),
    leituraM3,
    segundos: (performance.now() - inicioExecucao) / 1000,
  };
}
