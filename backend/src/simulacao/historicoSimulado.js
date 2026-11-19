import { adicionarHoras, diasEntre, inicioDoDia, momentoDoConsumo, UM_DIA } from '../utils/datas.js';
import { criarAleatorio, litrosNaHora } from './perfilConsumo.js';

/**
 * Gera leituras de hora em hora de `inicio` até `fim` para um leitor simulado,
 * passando pelo MESMO serviço de ingestão do hardware (consumo e alertas seguem as regras).
 * Usado pela carga inicial (conta demo) e ao ligar a simulação de uma conta nova.
 *
 * @param {object} deps { repositorios, ingestao }
 * @param {object} dispositivo leitor simulado
 * @param {object} opcoes
 * @param {Date} opcoes.inicio
 * @param {Date} opcoes.fim
 * @param {number} [opcoes.litrosDia] consumo médio diário da casa
 * @param {number} [opcoes.leituraInicialM3] valor do hidrômetro no início
 * @param {(diasAtras: number) => string} [opcoes.cenarioDoDia] cenário de cada dia (normal, pico, vazamento)
 */
export async function gerarHistoricoSimulado({ repositorios, ingestao }, dispositivo, {
  inicio, fim, litrosDia = 400, leituraInicialM3 = 100, cenarioDoDia = () => 'normal', semente = 2026,
}) {
  const aleatorio = criarAleatorio(semente);
  const silencioso = { silencioso: true }; // histórico não deve disparar avisos "ao vivo" no app
  const hoje = inicioDoDia(momentoDoConsumo(fim));
  let leituraM3 = leituraInicialM3;
  let quantidade = 1;

  await repositorios.transacao(async () => {
    await ingestao.receber(dispositivo, { timestamp: inicio.toISOString(), leitura_m3: leituraM3, bateria: 100, confianca: 1 }, silencioso);

    for (let instante = adicionarHoras(inicio, 1); instante <= fim; instante = adicionarHoras(instante, 1)) {
      // Dia do CALENDÁRIO (não janelas de 24 h): o cenário vale da 0h às 24h,
      // então um "dia de vazamento" cobre a madrugada inteira, 2h–5h.
      const diasAtras = diasEntre(inicioDoDia(momentoDoConsumo(instante)), hoje);
      leituraM3 += litrosNaHora(instante, { cenario: cenarioDoDia(diasAtras), litrosDia, aleatorio }) / 1000;
      // A bateria cai devagar (o leitor dorme entre as fotos): 100% -> ~82% no período
      const bateria = 100 - Math.floor((18 * (instante - inicio)) / (fim - inicio));
      await ingestao.receber(dispositivo, {
        timestamp: instante.toISOString(),
        leitura_m3: Math.round(leituraM3 * 1000) / 1000,
        bateria,
        confianca: 1,
      }, silencioso);
      quantidade++;
    }
  });

  // Alertas do histórico já foram "vistos"; ficam como não lidos só os dos últimos 3 dias
  const limiteNaoLido = new Date(fim - 3 * UM_DIA).toISOString();
  for (let pagina = 1; ; pagina++) {
    const { itens, total } = await repositorios.alertas.listar(
      { residenciaId: dispositivo.residenciaId }, { limite: 100, deslocamento: (pagina - 1) * 100 },
    );
    for (const alerta of itens) if (!alerta.lido && alerta.criadoEm < limiteNaoLido) await repositorios.alertas.marcarLido(alerta.id, true);
    if (pagina * 100 >= total) break;
  }

  return { quantidade, leituraM3 };
}
