import { randomUUID } from 'node:crypto';
import { EVENTOS } from '../eventos/barramento.js';
import { ErroAplicacao, ErroValidacao } from '../utils/erros.js';
import { arredondar } from '../utils/numeros.js';
import { formatarDataHora } from '../utils/formatos.js';
import { montarPagina, paraConsultaPaginada } from '../utils/paginacao.js';

/** Tolerância para variações de arredondamento do OCR (0,5 L). */
const TOLERANCIA_M3 = 0.0005;

export class LeituraServico {
  constructor({ repositorios, regrasAlerta, barramento }) {
    this.repositorios = repositorios;
    this.leituras = repositorios.leituras;
    this.regrasAlerta = regrasAlerta;
    this.barramento = barramento;
  }

  /**
   * Núcleo do registro de leituras (sensor, simulador ou manual):
   * 1. ignora reenvios (mesmo dispositivo + horário);
   * 2. calcula o consumo desde a leitura anterior;
   * 3. corrige o consumo da leitura seguinte (leituras que chegam fora de ordem);
   * 4. avalia as regras de alerta.
   */
  async registrar({ residencia, dispositivoId = null, lidoEm, leituraM3, origem, confianca = null }) {
    const resultado = await this.repositorios.transacao(async () => {
      if (dispositivoId) {
        const existente = await this.leituras.buscarPorDispositivoEInstante(dispositivoId, lidoEm);
        if (existente) return { leitura: existente, duplicada: true, alertas: [] };
      }

      const [anterior, proxima] = await Promise.all([
        this.leituras.buscarAnterior(residencia.id, lidoEm),
        this.leituras.buscarProxima(residencia.id, lidoEm),
      ]);
      this.#validarSequencia(leituraM3, anterior, proxima);

      const leitura = await this.leituras.criar({
        id: randomUUID(),
        dispositivoId,
        residenciaId: residencia.id,
        lidoEm,
        leituraM3,
        consumoLitros: anterior ? arredondar(Math.max(0, leituraM3 - anterior.leituraM3) * 1000, 3) : 0,
        origem,
        confianca,
        criadoEm: new Date().toISOString(),
      });

      if (proxima) {
        await this.leituras.atualizarConsumo(proxima.id, arredondar(Math.max(0, proxima.leituraM3 - leituraM3) * 1000, 3));
      }

      const alertas = await this.regrasAlerta.avaliarAposLeitura(residencia, leitura, anterior);
      return { leitura, duplicada: false, alertas };
    });

    if (!resultado.duplicada) {
      this.barramento.emit(EVENTOS.LEITURA_REGISTRADA, { residenciaId: residencia.id, leitura: resultado.leitura });
      for (const alerta of resultado.alertas) {
        this.barramento.emit(EVENTOS.ALERTA_CRIADO, { residenciaId: residencia.id, alerta });
      }
    }
    return resultado;
  }

  async registrarManual(residencia, { leituraM3, lidoEm }) {
    const instante = lidoEm ?? new Date().toISOString();
    if (new Date(instante) > new Date(Date.now() + 5 * 60 * 1000)) {
      throw new ErroValidacao('A data da leitura não pode estar no futuro.');
    }
    return this.registrar({ residencia, lidoEm: instante, leituraM3, origem: 'manual' });
  }

  async listar(residenciaId, { pagina, limite, ...filtros }) {
    const { itens, total } = await this.leituras.listar({ residenciaId, ...filtros }, paraConsultaPaginada({ pagina, limite }));
    return montarPagina(itens, total, { pagina, limite });
  }

  buscarUltima(residenciaId) {
    return this.leituras.buscarUltima(residenciaId);
  }

  #validarSequencia(leituraM3, anterior, proxima) {
    // O hidrômetro só avança: leitura menor que a anterior indica erro de OCR ou digitação.
    if (anterior && leituraM3 < anterior.leituraM3 - TOLERANCIA_M3) {
      throw new ErroAplicacao(
        `A leitura (${leituraM3} m³) é menor que a anterior (${anterior.leituraM3} m³ em ${formatarDataHora(anterior.lidoEm)}). Confira os números.`,
        { status: 422, codigo: 'LEITURA_MENOR_QUE_ANTERIOR' },
      );
    }
    if (proxima && leituraM3 > proxima.leituraM3 + TOLERANCIA_M3) {
      throw new ErroAplicacao(
        `A leitura (${leituraM3} m³) é maior que uma leitura posterior (${proxima.leituraM3} m³ em ${formatarDataHora(proxima.lidoEm)}).`,
        { status: 422, codigo: 'LEITURA_FORA_DE_SEQUENCIA' },
      );
    }
  }
}
