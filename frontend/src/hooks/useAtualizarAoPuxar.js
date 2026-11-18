import { useState } from 'react';

/**
 * "Puxar para atualizar" que só mostra o indicador quando o usuário puxa a tela.
 * Não usar `isRefetching` do React Query: ele também fica true nas recargas em
 * segundo plano (tempo real), o que faz o indicador aparecer e empurrar o conteúdo.
 */
export function useAtualizarAoPuxar(...recarregar) {
  const [atualizando, setAtualizando] = useState(false);

  const aoAtualizar = async () => {
    setAtualizando(true);
    try {
      await Promise.all(recarregar.map((fn) => fn()));
    } finally {
      setAtualizando(false);
    }
  };

  return { atualizando, aoAtualizar };
}
