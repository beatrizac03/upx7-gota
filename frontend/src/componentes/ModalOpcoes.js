import { memo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores, espaco, raio } from '../tema';

/** Folha inferior (bottom sheet) para escolher uma opção ou editar um valor. */
export const FolhaInferior = memo(function FolhaInferior({ visivel, titulo, aoFechar, children }) {
  const margens = useSafeAreaInsets();
  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={aoFechar} statusBarTranslucent>
      <Pressable style={estilos.fundo} onPress={aoFechar} accessibilityLabel="Fechar" />
      <View style={[estilos.folha, { paddingBottom: margens.bottom + espaco.xl }]}>
        <View style={estilos.alca} />
        <Text style={estilos.titulo}>{titulo}</Text>
        {children}
      </View>
    </Modal>
  );
});

export const ModalOpcoes = memo(function ModalOpcoes({ visivel, titulo, opcoes, valor, aoEscolher, aoFechar }) {
  return (
    <FolhaInferior visivel={visivel} titulo={titulo} aoFechar={aoFechar}>
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === valor;
        return (
          <Pressable
            key={String(opcao.valor)}
            onPress={() => aoEscolher(opcao.valor)}
            accessibilityRole="radio"
            accessibilityState={{ checked: ativo }}
            style={({ pressed }) => [estilos.opcao, ativo && estilos.opcaoAtiva, pressed && { opacity: 0.7 }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[estilos.textoOpcao, ativo && { color: cores.primariaTexto }]}>{opcao.rotulo}</Text>
              {opcao.descricao ? <Text style={estilos.descricao}>{opcao.descricao}</Text> : null}
            </View>
            {ativo && <Ionicons name="checkmark-circle" size={24} color={cores.primaria} />}
          </Pressable>
        );
      })}
    </FolhaInferior>
  );
});

const estilos = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: 'rgba(11, 31, 68, 0.35)' },
  folha: { backgroundColor: cores.superficie, borderTopLeftRadius: raio.xl, borderTopRightRadius: raio.xl, padding: espaco.xl, gap: espaco.md },
  alca: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: cores.borda, marginBottom: espaco.sm },
  titulo: { fontSize: 20, fontWeight: '700', color: cores.texto, marginBottom: espaco.sm },
  opcao: { flexDirection: 'row', alignItems: 'center', padding: espaco.lg, borderRadius: raio.md, borderWidth: 1.5, borderColor: cores.borda },
  opcaoAtiva: { borderColor: cores.primariaClara, backgroundColor: cores.primariaSuave },
  textoOpcao: { fontSize: 17, fontWeight: '600', color: cores.texto },
  descricao: { fontSize: 14, color: cores.textoSecundario, marginTop: 2 },
});
