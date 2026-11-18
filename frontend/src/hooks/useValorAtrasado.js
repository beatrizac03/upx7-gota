import { useEffect, useState } from 'react';

/** Debounce: só repassa o valor depois que ele para de mudar (ex.: arrastar o slider). */
export function useValorAtrasado(valor, atrasoMs = 250) {
  const [atrasado, setAtrasado] = useState(valor);
  useEffect(() => {
    const temporizador = setTimeout(() => setAtrasado(valor), atrasoMs);
    return () => clearTimeout(temporizador);
  }, [valor, atrasoMs]);
  return atrasado;
}
