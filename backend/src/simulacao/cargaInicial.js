import { ambiente } from '../config/ambiente.js';
import { adicionarHoras, adicionarMeses, inicioDaHora, inicioDoDia, paraIsoLocal, UM_DIA } from '../utils/datas.js';
import { criarAleatorio, litrosNaHora } from './perfilConsumo.js';

export const DEMO = Object.freeze({
  nome: 'Beatriz',
  email: 'demo@gota.app',
  senha: 'gota123',
  dispositivoId: 'gota-001',
});

/**
 * Cria o usuário de demonstração, a residência, o leitor simulado e ~N meses de
 * leituras de hora em hora. As leituras passam pelo MESMO serviço de ingestão do
 * hardware, então consumos e alertas históricos seguem as regras do sistema.
 * Usada pelo script `npm run carga-inicial` e pelo servidor (CARGA_INICIAL_AUTOMATICA).
 *
 * @returns {Promise<null | { leituras: number, alertas: number, inicio: string, fim: string, leituraM3: number, segundos: number }>}
 *          null se a conta demo já existir
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

  // Período: meia-noite de N meses atrás até a hora cheia atual
  const agora = inicioDaHora(new Date());
  const inicio = inicioDoDia(adicionarMeses(agora, -meses));
  const aleatorio = criarAleatorio(2026);

  // Episódios para o histórico ficar interessante: um vazamento consertado e alguns dias de pico
  const diasAtras = (instante) => Math.floor((agora - instante) / UM_DIA);
  const episodioVazamento = (d) => d >= 47 && d <= 49;
  const diasPico = new Set([12, 26, 33, 61, 75, 96, 118, 140]);

  let leituraM3 = 225.613 - 70; // termina perto do valor do exemplo do documento
  let quantidade = 1;

  await repositorios.transacao(async () => {
    // Primeira leitura (instalação do leitor)
    await servicos.ingestao.receber(dispositivo, { timestamp: inicio.toISOString(), leitura_m3: leituraM3, bateria: 100, confianca: 1 });

    for (let instante = adicionarHoras(inicio, 1); instante <= agora; instante = adicionarHoras(instante, 1)) {
      const d = diasAtras(adicionarHoras(instante, -1));
      const cenario = episodioVazamento(d) ? 'vazamento' : diasPico.has(d) ? 'pico' : 'normal';
      leituraM3 += litrosNaHora(instante, { cenario, aleatorio }) / 1000;
      // A bateria cai devagar (o leitor dorme entre as fotos): 100% -> ~82% no período
      const bateria = 100 - Math.floor((18 * (instante - inicio)) / (agora - inicio));
      await servicos.ingestao.receber(dispositivo, {
        timestamp: instante.toISOString(),
        leitura_m3: Math.round(leituraM3 * 1000) / 1000,
        bateria,
        confianca: 1,
      });
      quantidade++;
    }
  });

  // Alertas antigos já foram vistos; mantém como não lidos só os dos últimos 3 dias
  const limiteNaoLido = new Date(agora - 3 * UM_DIA).toISOString();
  for (let pagina = 1; ; pagina++) {
    const { itens, total } = await repositorios.alertas.listar({ residenciaId: residencia.id }, { limite: 100, deslocamento: (pagina - 1) * 100 });
    for (const alerta of itens) if (alerta.criadoEm < limiteNaoLido) await repositorios.alertas.marcarLido(alerta.id, true);
    if (pagina * 100 >= total) break;
  }

  const { total: alertas } = await repositorios.alertas.listar({ residenciaId: residencia.id }, { limite: 1, deslocamento: 0 });
  return {
    leituras: quantidade,
    alertas,
    inicio: paraIsoLocal(inicio),
    fim: paraIsoLocal(agora),
    leituraM3,
    segundos: (performance.now() - inicioExecucao) / 1000,
  };
}
