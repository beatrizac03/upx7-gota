import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alertaApi, consumoApi, dicaApi, dispositivoApi, leituraApi, residenciaApi, simulacaoApi, tarifaApi } from '../api/endpoints';
import { useSessao } from '../contexto/SessaoContexto';

/**
 * Camada de dados do app (React Query): cache, deduplicação de requisições,
 * paginação infinita e invalidação após mutações/eventos em tempo real.
 */
export const chaves = {
  consumo: ['consumo'],
  resumo: ['consumo', 'resumo'],
  historico: (parametros) => ['consumo', 'historico', parametros],
  perspectiva: ['consumo', 'perspectiva'],
  simulacaoMeta: (meta) => ['consumo', 'simulacao-meta', meta],
  alertas: (filtros) => ['alertas', filtros],
  dicas: (categoria) => ['dicas', categoria],
  dispositivos: ['dispositivos'],
  leituras: (filtros) => ['leituras', filtros],
  simulacao: ['simulacao'],
  estimativaConta: (litros, categoria) => ['tarifas', 'estimativa', Math.round(litros), categoria],
};

const proximaPagina = (ultima) => (ultima.paginacao.temProxima ? ultima.paginacao.pagina + 1 : undefined);

export const useResumo = () => useQuery({ queryKey: chaves.resumo, queryFn: consumoApi.resumo });

export const useHistorico = (parametros) =>
  useQuery({ queryKey: chaves.historico(parametros), queryFn: () => consumoApi.historico(parametros), placeholderData: keepPreviousData });

export const usePerspectiva = () => useQuery({ queryKey: chaves.perspectiva, queryFn: consumoApi.perspectiva });

export const useSimulacaoMeta = (meta) =>
  useQuery({
    queryKey: chaves.simulacaoMeta(meta),
    queryFn: () => consumoApi.simularMeta(meta),
    placeholderData: keepPreviousData,
    enabled: Boolean(meta),
    staleTime: 60_000,
  });

export const useDicas = (categoria) => useQuery({ queryKey: chaves.dicas(categoria), queryFn: () => dicaApi.listar(categoria) });

export const useDispositivos = () =>
  useQuery({ queryKey: chaves.dispositivos, queryFn: () => dispositivoApi.listar({ limite: 10 }) });

export const useAlertas = (filtros) =>
  useInfiniteQuery({
    queryKey: chaves.alertas(filtros),
    queryFn: ({ pageParam }) => alertaApi.listar({ ...filtros, pagina: pageParam, limite: 15 }),
    initialPageParam: 1,
    getNextPageParam: proximaPagina,
  });

export const useLeituras = (filtros) =>
  useInfiniteQuery({
    queryKey: chaves.leituras(filtros),
    queryFn: ({ pageParam }) => leituraApi.listar({ ...filtros, pagina: pageParam, limite: 20 }),
    initialPageParam: 1,
    getNextPageParam: proximaPagina,
  });

/* ---------- Mutações ---------- */

export function useMarcarAlertaLido() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (id) => alertaApi.marcarLido(id, true),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['alertas'] });
      cliente.invalidateQueries({ queryKey: chaves.resumo });
    },
  });
}

export function useMarcarTodosLidos() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: alertaApi.marcarTodosLidos,
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['alertas'] });
      cliente.invalidateQueries({ queryKey: chaves.resumo });
    },
  });
}

/** Atualiza a residência e recalcula tudo que depende dela (meta, moradores, tarifa). */
export function useAtualizarResidencia() {
  const cliente = useQueryClient();
  const { definirResidencia } = useSessao();
  return useMutation({
    mutationFn: residenciaApi.atualizar,
    onSuccess: (residencia) => {
      definirResidencia(residencia);
      cliente.invalidateQueries({ queryKey: chaves.consumo });
      cliente.invalidateQueries({ queryKey: ['dicas'] });
    },
  });
}

export function useRegistrarLeitura() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: leituraApi.registrarManual,
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: chaves.consumo });
      cliente.invalidateQueries({ queryKey: ['leituras'] });
      cliente.invalidateQueries({ queryKey: ['alertas'] });
    },
  });
}

export function useParearDispositivo() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: dispositivoApi.parear,
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: chaves.dispositivos });
      cliente.invalidateQueries({ queryKey: chaves.resumo });
    },
  });
}

export function useRemoverDispositivo() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: dispositivoApi.remover,
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: chaves.dispositivos });
      cliente.invalidateQueries({ queryKey: chaves.resumo });
    },
  });
}

/** Cálculo detalhado da conta (faixas, esgoto, total) para a explicação "Como calculamos?". */
export const useEstimativaConta = (litros, categoria, ativo = true) =>
  useQuery({
    queryKey: chaves.estimativaConta(litros, categoria),
    queryFn: () => tarifaApi.estimativa(litros, categoria),
    enabled: ativo && litros !== null && litros !== undefined,
    staleTime: Infinity,
  });

/* ---------- Simulação controlada pelo app ---------- */

/** Enquanto a simulação está ligada, atualiza o relógio simulado a cada 5 s. */
export const useSimulacao = (ativo = true) =>
  useQuery({
    queryKey: chaves.simulacao,
    queryFn: simulacaoApi.estado,
    enabled: ativo,
    refetchInterval: (consulta) => (consulta.state.data?.ativa ? 5000 : false),
  });

function useMutacaoSimulacao(mutationFn) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (estado) => {
      cliente.setQueryData(chaves.simulacao, estado);
      cliente.invalidateQueries({ queryKey: chaves.consumo });
      cliente.invalidateQueries({ queryKey: ['leituras'] });
    },
  });
}

export const useIniciarSimulacao = () => useMutacaoSimulacao(simulacaoApi.iniciar);
export const useAlterarSimulacao = () => useMutacaoSimulacao(simulacaoApi.alterar);
export const usePararSimulacao = () => useMutacaoSimulacao(simulacaoApi.parar);
