import { api } from './cliente';

/** Um objeto por recurso da API (espelha backend/src/rotas). */
export const autenticacaoApi = {
  entrar: (dados) => api.post('/autenticacao/entrar', dados),
  cadastrar: (dados) => api.post('/autenticacao/cadastro', dados),
  perfil: () => api.get('/autenticacao/perfil'),
};

export const residenciaApi = {
  criar: (dados) => api.post('/residencias', dados),
  obter: () => api.get('/residencias/minha'),
  atualizar: (campos) => api.patch('/residencias/minha', campos),
  sugestaoMeta: (moradores) => api.get('/residencias/sugestao-meta', { moradores }),
};

export const consumoApi = {
  resumo: () => api.get('/consumo/resumo'),
  historico: (consulta) => api.get('/consumo/historico', consulta),
  perspectiva: () => api.get('/consumo/perspectiva'),
  simularMeta: (metaDiariaLitros) => api.get('/consumo/simulacao-meta', { metaDiariaLitros }),
};

export const dispositivoApi = {
  listar: (consulta) => api.get('/dispositivos', consulta),
  parear: (dados) => api.post('/dispositivos', dados),
  remover: (id) => api.delete(`/dispositivos/${encodeURIComponent(id)}`),
};

export const leituraApi = {
  listar: (consulta) => api.get('/leituras', consulta),
  ultima: () => api.get('/leituras/ultima'),
  registrarManual: (dados) => api.post('/leituras', dados),
};

export const alertaApi = {
  listar: (consulta) => api.get('/alertas', consulta),
  marcarLido: (id, lido = true) => api.patch(`/alertas/${id}`, { lido }),
  marcarTodosLidos: () => api.post('/alertas/marcar-todos-lidos'),
};

export const dicaApi = {
  listar: (categoria) => api.get('/dicas', { categoria }),
};

export const tarifaApi = {
  tabela: () => api.get('/tarifas'),
};
