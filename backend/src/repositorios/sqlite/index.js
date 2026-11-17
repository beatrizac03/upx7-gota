import { AsyncLocalStorage } from 'node:async_hooks';
import { abrirSqlite } from '../../banco/sqlite/conexao.js';
import { UsuarioRepositorioSqlite } from './usuario.repositorio.js';
import { ResidenciaRepositorioSqlite } from './residencia.repositorio.js';
import { DispositivoRepositorioSqlite } from './dispositivo.repositorio.js';
import { LeituraRepositorioSqlite } from './leitura.repositorio.js';
import { AlertaRepositorioSqlite } from './alerta.repositorio.js';

/** @returns {import('../contratos.js').Repositorios} */
export function criarRepositoriosSqlite(caminho) {
  const db = abrirSqlite(caminho);
  const contextoTransacao = new AsyncLocalStorage();
  let fila = Promise.resolve();

  /**
   * Executa o trabalho dentro de uma transação. As transações são enfileiradas
   * (uma conexão SQLite só tem uma transação ativa), e chamadas aninhadas
   * reaproveitam a transação externa.
   */
  function transacao(trabalho) {
    if (contextoTransacao.getStore()) return trabalho();

    const executar = () =>
      contextoTransacao.run(true, async () => {
        db.exec('BEGIN IMMEDIATE');
        try {
          const resultado = await trabalho();
          db.exec('COMMIT');
          return resultado;
        } catch (erro) {
          db.exec('ROLLBACK');
          throw erro;
        }
      });

    const resultado = fila.then(executar, executar);
    fila = resultado.catch(() => {});
    return resultado;
  }

  return {
    usuarios: new UsuarioRepositorioSqlite(db),
    residencias: new ResidenciaRepositorioSqlite(db),
    dispositivos: new DispositivoRepositorioSqlite(db),
    leituras: new LeituraRepositorioSqlite(db),
    alertas: new AlertaRepositorioSqlite(db),
    transacao,
    fechar: () => db.close(),
  };
}
