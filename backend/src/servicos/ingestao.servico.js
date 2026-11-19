import { ambiente } from '../config/ambiente.js';
import { daIngestao } from '../mapeadores/leitura.mapeador.js';
import { ErroAplicacao, ErroNaoEncontrado } from '../utils/erros.js';

const ORIGEM_POR_TIPO = { camera: 'sensor', simulado: 'simulador' };

/**
 * Entrada de dados do hardware (leitor Gota com ESP32-CAM) ou do simulador.
 * Ambos usam exatamente o mesmo contrato, então trocar um pelo outro não muda nada no app.
 */
export class IngestaoServico {
  constructor({ repositorios, leituraServico, dispositivoServico }) {
    this.residencias = repositorios.residencias;
    this.leituraServico = leituraServico;
    this.dispositivoServico = dispositivoServico;
  }

  async receber(dispositivo, payload, { silencioso = false } = {}) {
    const dados = daIngestao({ ...payload, device_id: dispositivo.id });

    if (dados.confianca !== null && dados.confianca < ambiente.confiancaMinima) {
      throw new ErroAplicacao(
        `Leitura recusada: confiança do OCR (${dados.confianca}) abaixo do mínimo (${ambiente.confiancaMinima}). Tire outra foto.`,
        { status: 422, codigo: 'CONFIANCA_BAIXA' },
      );
    }
    // O simulador acelera o tempo, então só o leitor real é impedido de enviar datas futuras.
    if (dispositivo.tipo === 'camera' && new Date(dados.lidoEm) > new Date(Date.now() + 10 * 60 * 1000)) {
      throw new ErroAplicacao('Horário da leitura no futuro. Verifique o relógio (NTP) do leitor.', {
        status: 422,
        codigo: 'HORARIO_INVALIDO',
      });
    }

    const residencia = await this.residencias.buscarPorId(dispositivo.residenciaId);
    if (!residencia) throw new ErroNaoEncontrado('Residência do dispositivo não encontrada.');

    const resultado = await this.leituraServico.registrar({
      residencia,
      dispositivoId: dispositivo.id,
      lidoEm: dados.lidoEm,
      leituraM3: dados.leituraM3,
      origem: ORIGEM_POR_TIPO[dispositivo.tipo] ?? 'sensor',
      confianca: dados.confianca,
      silencioso,
    });
    await this.dispositivoServico.registrarContato(dispositivo, dados.bateria, { emitir: !silencioso });
    return resultado;
  }

  /** Leituras guardadas na memória do leitor enquanto estava sem Wi-Fi. */
  async receberLote(dispositivo, { leituras }) {
    const ordenadas = [...leituras].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const resultados = [];
    for (const payload of ordenadas) {
      try {
        const { leitura, duplicada } = await this.receber(dispositivo, payload);
        resultados.push({ timestamp: payload.timestamp, status: duplicada ? 'duplicada' : 'gravada', leituraId: leitura.id });
      } catch (erro) {
        if (!(erro instanceof ErroAplicacao)) throw erro;
        resultados.push({ timestamp: payload.timestamp, status: 'recusada', motivo: erro.message });
      }
    }
    return {
      total: resultados.length,
      gravadas: resultados.filter((r) => r.status === 'gravada').length,
      duplicadas: resultados.filter((r) => r.status === 'duplicada').length,
      recusadas: resultados.filter((r) => r.status === 'recusada').length,
      resultados,
    };
  }

  /**
   * "Estou vivo": o leitor acordou (ou ligou) e sincroniza com o servidor.
   * Devolve a última leitura conhecida para o leitor validar o OCR (o valor só pode subir).
   */
  async sinal(dispositivo, { bateria }) {
    await this.dispositivoServico.registrarContato(dispositivo, bateria);
    return this.leituraServico.buscarUltima(dispositivo.residenciaId);
  }
}
