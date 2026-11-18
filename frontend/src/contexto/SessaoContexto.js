import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { aoSessaoExpirar, definirToken } from '../api/cliente';
import { autenticacaoApi } from '../api/endpoints';
import { armazenamentoSessao } from '../armazenamento/sessao';

const SessaoContexto = createContext(null);

const ESTADO_VAZIO = { carregando: false, erroInicial: null, token: null, usuario: null, residencia: null };

/**
 * Sessão do usuário: token, dados do usuário e da residência.
 * A navegação decide o fluxo (login, cadastro inicial ou app) a partir daqui.
 */
export function ProvedorSessao({ children }) {
  const clienteConsultas = useQueryClient();
  const [estado, setEstado] = useState({ ...ESTADO_VAZIO, carregando: true });

  const sair = useCallback(async () => {
    await armazenamentoSessao.limpar();
    definirToken(null);
    clienteConsultas.clear();
    setEstado(ESTADO_VAZIO);
  }, [clienteConsultas]);

  /** Valida no servidor o token salvo no aparelho e carrega usuário + residência. */
  const validarTokenSalvo = useCallback(async (token) => {
    if (!token) return setEstado(ESTADO_VAZIO);
    definirToken(token);
    try {
      const { usuario, residencia } = await autenticacaoApi.perfil();
      setEstado({ ...ESTADO_VAZIO, token, usuario, residencia });
    } catch (erro) {
      if (erro.status === 401) return sair();
      setEstado({ ...ESTADO_VAZIO, erroInicial: erro });
    }
  }, [sair]);

  useEffect(() => {
    aoSessaoExpirar(sair);
    armazenamentoSessao.obterToken().then(validarTokenSalvo);
  }, [validarTokenSalvo, sair]);

  /** "Tentar novamente" da tela de erro de conexão. */
  const restaurar = useCallback(() => {
    setEstado((atual) => ({ ...atual, carregando: true, erroInicial: null }));
    return armazenamentoSessao.obterToken().then(validarTokenSalvo);
  }, [validarTokenSalvo]);

  const iniciar = useCallback(async ({ token, usuario, residencia }) => {
    await armazenamentoSessao.salvarToken(token);
    definirToken(token);
    setEstado({ ...ESTADO_VAZIO, token, usuario, residencia });
  }, []);

  const entrar = useCallback(async (email, senha) => iniciar(await autenticacaoApi.entrar({ email, senha })), [iniciar]);
  const cadastrar = useCallback(async (dados) => iniciar(await autenticacaoApi.cadastrar(dados)), [iniciar]);
  const definirResidencia = useCallback((residencia) => setEstado((atual) => ({ ...atual, residencia })), []);

  const valor = useMemo(
    () => ({ ...estado, entrar, cadastrar, sair, restaurar, definirResidencia }),
    [estado, entrar, cadastrar, sair, restaurar, definirResidencia],
  );
  return <SessaoContexto.Provider value={valor}>{children}</SessaoContexto.Provider>;
}

export function useSessao() {
  const contexto = useContext(SessaoContexto);
  if (!contexto) throw new Error('useSessao deve ser usado dentro de ProvedorSessao');
  return contexto;
}
