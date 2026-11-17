/**
 * Contratos (interfaces) dos repositórios.
 *
 * Os serviços dependem APENAS destes métodos. Para trocar de banco (ex.: Supabase),
 * basta criar outra implementação com as mesmas assinaturas e registrá-la em
 * `src/repositorios/index.js`. Todos os métodos são assíncronos de propósito,
 * mesmo no SQLite (síncrono), para que a troca não exija mudar os serviços.
 *
 * Datas entram e saem como string ISO 8601 em UTC.
 *
 * @typedef {Object} Paginacao
 * @property {number} limite
 * @property {number} deslocamento
 *
 * @typedef {Object} ResultadoPaginado
 * @property {Array<any>} itens
 * @property {number} total
 *
 * @typedef {Object} UsuarioRepositorio
 * @property {(usuario: object) => Promise<object>} criar
 * @property {(id: string) => Promise<object|null>} buscarPorId
 * @property {(email: string) => Promise<object|null>} buscarPorEmail
 *
 * @typedef {Object} ResidenciaRepositorio
 * @property {(residencia: object) => Promise<object>} criar
 * @property {(id: string) => Promise<object|null>} buscarPorId
 * @property {(usuarioId: string) => Promise<object|null>} buscarPorUsuarioId
 * @property {(id: string, campos: object) => Promise<object>} atualizar
 *
 * @typedef {Object} DispositivoRepositorio
 * @property {(dispositivo: object) => Promise<object>} criar
 * @property {(id: string) => Promise<object|null>} buscarPorId
 * @property {(filtros: {residenciaId: string, tipo?: string}, paginacao: Paginacao) => Promise<ResultadoPaginado>} listar
 * @property {(id: string, dados: {bateria?: number|null, ultimoContato: string}) => Promise<void>} registrarContato
 * @property {(limiteIso: string) => Promise<object[]>} listarSemContatoDesde
 * @property {(id: string) => Promise<void>} remover
 *
 * @typedef {Object} LeituraRepositorio
 * @property {(leitura: object) => Promise<object>} criar
 * @property {(id: string) => Promise<object|null>} buscarPorId
 * @property {(dispositivoId: string, lidoEm: string) => Promise<object|null>} buscarPorDispositivoEInstante
 * @property {(residenciaId: string, lidoEm: string) => Promise<object|null>} buscarAnterior   Última leitura com lido_em < lidoEm
 * @property {(residenciaId: string, lidoEm: string) => Promise<object|null>} buscarProxima    Primeira leitura com lido_em > lidoEm
 * @property {(residenciaId: string) => Promise<object|null>} buscarUltima
 * @property {(residenciaId: string) => Promise<object|null>} buscarPrimeira
 * @property {(id: string, consumoLitros: number) => Promise<void>} atualizarConsumo
 * @property {(filtros: object, paginacao: Paginacao) => Promise<ResultadoPaginado>} listar
 * @property {(residenciaId: string, inicio: string, fim: string) => Promise<number>} somarConsumo  Soma de leituras com inicio < lido_em <= fim
 * @property {(residenciaId: string, inicio: string, fim: string, agrupamento: 'hora'|'dia'|'mes') => Promise<Array<{chave: string, litros: number}>>} agruparConsumo
 *
 * @typedef {Object} AlertaRepositorio
 * @property {(alerta: object) => Promise<object|null>} criarSeNaoExistir  Retorna null se já existir (mesmo tipo + referência)
 * @property {(id: string) => Promise<object|null>} buscarPorId
 * @property {(filtros: object, paginacao: Paginacao) => Promise<ResultadoPaginado>} listar
 * @property {(id: string, lido: boolean) => Promise<void>} marcarLido
 * @property {(residenciaId: string) => Promise<number>} marcarTodosLidos
 * @property {(residenciaId: string) => Promise<number>} contarNaoLidos
 * @property {(residenciaId: string, tipo: string, desdeIso: string) => Promise<object|null>} buscarRecenteNaoLido
 *
 * @typedef {Object} Repositorios
 * @property {UsuarioRepositorio} usuarios
 * @property {ResidenciaRepositorio} residencias
 * @property {DispositivoRepositorio} dispositivos
 * @property {LeituraRepositorio} leituras
 * @property {AlertaRepositorio} alertas
 * @property {<T>(trabalho: () => Promise<T>) => Promise<T>} transacao
 * @property {() => void} fechar
 */

export {};
