import { memo } from 'react';
import { Etiqueta } from '../../componentes';

const STATUS = {
  conectado: { tom: 'sucesso', texto: 'Conectado', icone: 'wifi' },
  offline: { tom: 'perigo', texto: 'Offline', icone: 'cloud-offline-outline' },
  aguardando: { tom: 'aviso', texto: 'Aguardando leitura', icone: 'time-outline' },
};

export const RotuloStatus = memo(function RotuloStatus({ status }) {
  const s = STATUS[status] ?? STATUS.aguardando;
  return <Etiqueta tom={s.tom} texto={s.texto} icone={s.icone} />;
});
