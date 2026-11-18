import { createNavigationContainerRef } from '@react-navigation/native';

/** Permite navegar de fora das telas (ex.: ao tocar no aviso de alerta em tempo real). */
export const referenciaNavegacao = createNavigationContainerRef();

export function navegarPara(rota, parametros) {
  if (referenciaNavegacao.isReady()) referenciaNavegacao.navigate(rota, parametros);
}
