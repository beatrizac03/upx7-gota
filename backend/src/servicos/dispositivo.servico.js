import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { EVENTOS } from '../eventos/barramento.js';
import { ErroConflito, ErroNaoAutenticado, ErroNaoEncontrado } from '../utils/erros.js';
import { montarPagina, paraConsultaPaginada } from '../utils/paginacao.js';

const hashChave = (chave) => createHash('sha256').update(chave).digest('hex');

export class DispositivoServico {
  constructor({ repositorios, barramento }) {
    this.dispositivos = repositorios.dispositivos;
    this.barramento = barramento;
  }

  /**
   * Pareamento: gera o identificador e a chave secreta do leitor.
   * A chave só é devolvida aqui (no banco fica apenas o hash) e seria gravada
   * no leitor durante a configuração pela rede "Gota-Setup".
   */
  async parear(residencia, { nome, tipo }) {
    const id = `gota-${randomBytes(3).toString('hex')}`;
    const chave = randomBytes(24).toString('base64url');
    const dispositivo = await this.registrar(residencia.id, { id, nome, tipo, chave });
    return { dispositivo, chave };
  }

  /** Registra um dispositivo com id e chave conhecidos (usado pela carga inicial). */
  async registrar(residenciaId, { id, nome, tipo, chave }) {
    if (await this.dispositivos.buscarPorId(id)) throw new ErroConflito(`O dispositivo ${id} já está cadastrado.`);
    return this.dispositivos.criar({
      id,
      residenciaId,
      nome,
      tipo,
      chaveHash: hashChave(chave),
      criadoEm: new Date().toISOString(),
    });
  }

  async listar(residenciaId, { pagina, limite, tipo }) {
    const { itens, total } = await this.dispositivos.listar({ residenciaId, tipo }, paraConsultaPaginada({ pagina, limite }));
    return montarPagina(itens, total, { pagina, limite });
  }

  async obter(residenciaId, id) {
    const dispositivo = await this.dispositivos.buscarPorId(id);
    if (!dispositivo || dispositivo.residenciaId !== residenciaId) throw new ErroNaoEncontrado('Medidor não encontrado.');
    return dispositivo;
  }

  async remover(residenciaId, id) {
    await this.obter(residenciaId, id);
    await this.dispositivos.remover(id);
  }

  /** Valida a chave enviada pelo hardware (comparação em tempo constante). */
  async autenticar(id, chave) {
    const dispositivo = id && chave ? await this.dispositivos.buscarPorId(id) : null;
    const esperado = dispositivo ? Buffer.from(dispositivo.chaveHash, 'hex') : Buffer.alloc(32);
    const recebido = Buffer.from(hashChave(chave ?? ''), 'hex');
    if (!dispositivo || !timingSafeEqual(esperado, recebido)) {
      throw new ErroNaoAutenticado('Dispositivo ou chave inválidos.');
    }
    return dispositivo;
  }

  async registrarContato(dispositivo, bateria) {
    const ultimoContato = new Date().toISOString();
    await this.dispositivos.registrarContato(dispositivo.id, { bateria, ultimoContato });
    const atualizado = { ...dispositivo, bateria: bateria ?? dispositivo.bateria, ultimoContato };
    this.barramento.emit(EVENTOS.DISPOSITIVO_ATUALIZADO, { residenciaId: dispositivo.residenciaId, dispositivo: atualizado });
    return atualizado;
  }
}
