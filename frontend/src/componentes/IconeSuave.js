import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { cores } from '../tema';

const TONS = {
  info: [cores.primariaSuave, cores.primaria],
  sucesso: [cores.sucessoSuave, cores.sucesso],
  perigo: [cores.perigoSuave, cores.perigo],
  aviso: [cores.avisoSuave, cores.aviso],
};

/** Ícone sobre quadrado arredondado de fundo suave (padrão dos cartões do design). */
export const IconeSuave = memo(function IconeSuave({ nome, familia = 'ion', tom = 'info', tamanho = 56, redondo = false }) {
  const [fundo, cor] = TONS[tom];
  const Familia = familia === 'mci' ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={[estilos.base, { width: tamanho, height: tamanho, backgroundColor: fundo, borderRadius: redondo ? tamanho / 2 : tamanho * 0.3 }]}>
      <Familia name={nome} size={tamanho * 0.5} color={cor} />
    </View>
  );
});

const estilos = StyleSheet.create({ base: { alignItems: 'center', justifyContent: 'center' } });
