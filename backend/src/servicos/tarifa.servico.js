import tarifas from '../config/tarifas.json' with { type: 'json' };
import { arredondar } from '../utils/numeros.js';

/** Calcula a conta (água + esgoto) pela tarifa progressiva por faixas. */
export class TarifaServico {
  obterTabela() {
    return tarifas;
  }

  obterCategoria(nome) {
    return tarifas.categorias[nome] ?? tarifas.categorias.residencial;
  }

  /**
   * @param {number} litros consumo do mês em litros
   * @param {string} categoria categoria tarifária da residência
   */
  calcular(litros, categoria = 'residencial') {
    const tabela = this.obterCategoria(categoria);
    const m3 = Math.max(0, litros) / 1000;
    const faixas = [];
    let inicioFaixa = 0;
    let variavel = 0;

    for (const faixa of tabela.faixas) {
      const fimFaixa = faixa.ateM3 ?? Infinity;
      const volume = Math.max(0, Math.min(m3, fimFaixa) - inicioFaixa);
      if (volume > 0) {
        const subtotal = volume * faixa.valorM3;
        variavel += subtotal;
        faixas.push({
          deM3: inicioFaixa,
          ateM3: faixa.ateM3,
          volumeM3: arredondar(volume, 3),
          valorM3: faixa.valorM3,
          subtotal: arredondar(subtotal),
        });
      }
      if (m3 <= fimFaixa) break;
      inicioFaixa = fimFaixa;
    }

    const agua = tabela.tarifaFixaAgua + variavel;
    const esgoto = agua * tabela.percentualEsgoto;
    return {
      categoria: tabela.nome,
      litros: arredondar(litros, 0),
      m3: arredondar(m3, 3),
      tarifaFixa: tabela.tarifaFixaAgua,
      percentualEsgoto: tabela.percentualEsgoto,
      fonte: tarifas.fonte,
      vigencia: tarifas.vigencia,
      agua: arredondar(agua),
      esgoto: arredondar(esgoto),
      total: arredondar(agua + esgoto),
      faixas,
    };
  }

  total(litros, categoria) {
    return this.calcular(litros, categoria).total;
  }
}
