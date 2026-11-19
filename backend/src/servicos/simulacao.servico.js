import { ambiente } from '../config/ambiente.js';
import { CENARIOS, litrosNaHora } from '../simulacao/perfilConsumo.js';
import { gerarHistoricoSimulado } from '../simulacao/historicoSimulado.js';
import { adicionarDias, inicioDaHora, inicioDoDia, paraIsoLocal } from '../utils/datas.js';
import { ErroAplicacao } from '../utils/erros.js';

export const VELOCIDADES = Object.freeze({
  normal: { rotulo: 'Normal', passoMinutos: 15, intervaloSegundos: 5, descricao: '15 min simulados a cada 5 s' },
  rapida: { rotulo: 'Rápida', passoMinutos: 60, intervaloSegundos: 2, descricao: '1 hora simulada a cada 2 s' },
});

/** A simulação desliga sozinha para não ficar rodando para sempre num servidor hospedado. */
const DURACAO_MAXIMA_MS = 30 * 60 * 1000;

/** Conta nova sem leituras: gera este histórico de exemplo para as telas não abrirem vazias. */
const DIAS_HISTORICO = 90;
const LITROS_POR_PESSOA_DIA = 100;

/**
 * Simulador do leitor Gota rodando DENTRO do servidor e controlado pelo app
 * (para quem não vai abrir um terminal, ex.: avaliação do professor).
 *
 * Cada passo monta a leitura no formato do hardware e chama o mesmo serviço de
 * ingestão do endpoint POST /ingestao/leituras: mesmas validações, consumo e alertas.
 * O script `npm run simulador` continua existindo e testa o caminho HTTP completo.
 */
export class SimulacaoServico {
  /** @type {Map<string, object>} residenciaId -> sessão */
  #sessoes = new Map();

  constructor({ repositorios, ingestaoServico, regrasAlerta }) {
    this.repositorios = repositorios;
    this.ingestao = ingestaoServico;
    this.regrasAlerta = regrasAlerta;
  }

  estado(residenciaId) {
    const sessao = this.#sessoes.get(residenciaId);
    const opcoes = {
      cenarios: Object.entries(CENARIOS).map(([valor, c]) => ({ valor, descricao: c.descricao })),
      velocidades: Object.entries(VELOCIDADES).map(([valor, v]) => ({ valor, rotulo: v.rotulo, descricao: v.descricao })),
    };
    if (!sessao) return { ativa: false, ...opcoes };
    return {
      ativa: true,
      cenario: sessao.cenario,
      velocidade: sessao.velocidade,
      dispositivoId: sessao.dispositivo.id,
      relogioSimulado: sessao.relogio.toISOString(),
      leiturasEnviadas: sessao.enviadas,
      leiturasGuardadas: sessao.memoria.length,
      historicoGerado: sessao.historicoGerado,
      encerraEm: new Date(sessao.iniciadaEm + DURACAO_MAXIMA_MS).toISOString(),
      ultimoErro: sessao.ultimoErro,
      ...opcoes,
    };
  }

  async iniciar(residencia, { cenario = 'normal', velocidade = 'normal' }) {
    if (this.#sessoes.has(residencia.id)) return this.atualizar(residencia.id, { cenario, velocidade });

    const { itens } = await this.repositorios.dispositivos.listar({ residenciaId: residencia.id, tipo: 'simulado' }, { limite: 1, deslocamento: 0 });
    const dispositivo = itens[0];
    if (!dispositivo) {
      throw new ErroAplicacao('Conecte um leitor do tipo "Simulado (protótipo)" para usar a simulação.', {
        status: 409,
        codigo: 'SEM_LEITOR_SIMULADO',
      });
    }

    const litrosDia = residencia.moradores * LITROS_POR_PESSOA_DIA;
    const historicoGerado = await this.#gerarHistoricoSeVazio(residencia, dispositivo, litrosDia);

    const sessao = {
      residenciaId: residencia.id,
      dispositivo,
      litrosDia,
      historicoGerado,
      cenario,
      velocidade,
      bateria: dispositivo.bateria ?? 90,
      memoria: [],
      enviadas: 0,
      ultimoErro: null,
      iniciadaEm: Date.now(),
      timer: null,
    };
    await this.#sincronizar(sessao);
    this.#sessoes.set(residencia.id, sessao);
    this.#agendar(sessao);
    return this.estado(residencia.id);
  }

  atualizar(residenciaId, { cenario, velocidade }) {
    const sessao = this.#sessoes.get(residenciaId);
    if (!sessao) throw new ErroAplicacao('A simulação não está ligada.', { status: 409, codigo: 'SIMULACAO_PARADA' });
    if (cenario) sessao.cenario = cenario;
    if (velocidade && velocidade !== sessao.velocidade) {
      sessao.velocidade = velocidade;
      clearTimeout(sessao.timer);
      this.#agendar(sessao);
    }
    return this.estado(residenciaId);
  }

  async parar(residenciaId) {
    const sessao = this.#sessoes.get(residenciaId);
    if (!sessao) return this.estado(residenciaId);
    this.#sessoes.delete(residenciaId);
    clearTimeout(sessao.timer);
    // Ao desligar, o leitor "volta" e entrega o que guardou, para não perder consumo
    await this.#enviarMemoria(sessao).catch(() => {});
    return this.estado(residenciaId);
  }

  pararTodas() {
    for (const sessao of this.#sessoes.values()) clearTimeout(sessao.timer);
    this.#sessoes.clear();
  }

  /** Primeira vez de um leitor simulado: cria DIAS_HISTORICO dias de leituras de exemplo (com um vazamento e alguns picos). */
  async #gerarHistoricoSeVazio(residencia, dispositivo, litrosDia) {
    if (await this.repositorios.leituras.buscarUltima(residencia.id)) return false;
    const fim = inicioDaHora(new Date());
    const diasPico = new Set([4, 9, 15, 27, 38, 52, 66, 80]);
    await gerarHistoricoSimulado({ repositorios: this.repositorios, ingestao: this.ingestao }, dispositivo, {
      inicio: inicioDoDia(adicionarDias(fim, -DIAS_HISTORICO)),
      fim,
      litrosDia,
      leituraInicialM3: 100,
      cenarioDoDia: (d) => (d === 20 ? 'vazamento' : diasPico.has(d) ? 'pico' : 'normal'),
    });
    return true;
  }

  /** Continua do último valor do hidrômetro (o mesmo que o leitor real faz ao ligar). */
  async #sincronizar(sessao) {
    const ultima = await this.repositorios.leituras.buscarUltima(sessao.residenciaId);
    sessao.relogio = ultima ? new Date(ultima.lidoEm) : inicioDaHora(new Date());
    sessao.leituraM3 = ultima?.leituraM3 ?? 100;
    sessao.ultimoEnvio = sessao.relogio;
  }

  #agendar(sessao) {
    const { intervaloSegundos } = VELOCIDADES[sessao.velocidade];
    sessao.timer = setTimeout(async () => {
      await this.#passo(sessao);
      if (this.#sessoes.get(sessao.residenciaId) === sessao) this.#agendar(sessao);
    }, intervaloSegundos * 1000);
    sessao.timer.unref?.();
  }

  async #passo(sessao) {
    if (Date.now() - sessao.iniciadaEm > DURACAO_MAXIMA_MS) {
      await this.parar(sessao.residenciaId);
      return;
    }

    const { passoMinutos } = VELOCIDADES[sessao.velocidade];
    sessao.relogio = new Date(sessao.relogio.getTime() + passoMinutos * 60_000);
    const litros = litrosNaHora(sessao.relogio, { cenario: sessao.cenario, minutos: passoMinutos, litrosDia: sessao.litrosDia });
    sessao.leituraM3 = Math.round((sessao.leituraM3 + litros / 1000) * 1000) / 1000;
    if (Math.random() < 0.01) sessao.bateria = Math.max(5, sessao.bateria - 1);

    const leitura = {
      timestamp: paraIsoLocal(sessao.relogio),
      leitura_m3: sessao.leituraM3,
      bateria: sessao.bateria,
      confianca: 1,
    };

    if (sessao.cenario === 'offline') {
      sessao.memoria.push(leitura);
      await this.#verificarSemSinal(sessao);
      return;
    }

    try {
      await this.#enviarMemoria(sessao);
      await this.ingestao.receber(sessao.dispositivo, leitura);
      sessao.enviadas++;
      sessao.ultimoEnvio = sessao.relogio;
      sessao.ultimoErro = null;
    } catch (erro) {
      sessao.ultimoErro = erro.message;
      // Ex.: alguém registrou uma leitura manual maior; ressincroniza e segue
      if (erro.codigo === 'LEITURA_MENOR_QUE_ANTERIOR' || erro.codigo === 'LEITURA_FORA_DE_SEQUENCIA') await this.#sincronizar(sessao);
    }
  }

  async #enviarMemoria(sessao) {
    if (!sessao.memoria.length) return;
    const lote = sessao.memoria;
    sessao.memoria = [];
    await this.ingestao.receberLote(sessao.dispositivo, { leituras: lote });
    sessao.enviadas += lote.length;
    sessao.ultimoEnvio = sessao.relogio;
  }

  /** No cenário "sem Wi-Fi", gera o alerta quando o tempo simulado sem envio passa do limite (12 h). */
  async #verificarSemSinal(sessao) {
    const minutosSemEnvio = (sessao.relogio - sessao.ultimoEnvio) / 60_000;
    if (minutosSemEnvio < ambiente.limiteOfflineMinutos) return;
    await this.regrasAlerta.alertarDispositivoOffline(
      { ...sessao.dispositivo, bateria: sessao.bateria },
      { ultimoContato: sessao.ultimoEnvio.toISOString(), agora: sessao.relogio.toISOString() },
    );
  }
}
