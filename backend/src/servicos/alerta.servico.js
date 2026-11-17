import { ErroNaoEncontrado } from '../utils/erros.js';
import { montarPagina, paraConsultaPaginada } from '../utils/paginacao.js';

export class AlertaServico {
  constructor({ repositorios }) {
    this.alertas = repositorios.alertas;
  }

  async listar(residenciaId, { pagina, limite, tipo, lido }) {
    const { itens, total } = await this.alertas.listar({ residenciaId, tipo, lido }, paraConsultaPaginada({ pagina, limite }));
    const naoLidos = await this.alertas.contarNaoLidos(residenciaId);
    return { ...montarPagina(itens, total, { pagina, limite }), naoLidos };
  }

  async marcarLido(residenciaId, id, lido) {
    const alerta = await this.alertas.buscarPorId(id);
    if (!alerta || alerta.residenciaId !== residenciaId) throw new ErroNaoEncontrado('Alerta não encontrado.');
    await this.alertas.marcarLido(id, lido);
    return { ...alerta, lido };
  }

  marcarTodosLidos(residenciaId) {
    return this.alertas.marcarTodosLidos(residenciaId);
  }
}
