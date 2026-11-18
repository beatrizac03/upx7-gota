import { memo } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cores, espaco } from '../tema';

/** Bolhas azuis suaves do fundo (Views simples, sem custo de SVG). */
export const FundoDecorativo = memo(function FundoDecorativo() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[estilos.bolha, { width: 320, height: 320, top: -120, right: -150 }]} />
      <View style={[estilos.bolha, { width: 280, height: 280, bottom: -120, left: -160 }]} />
    </View>
  );
});

/**
 * Contêiner padrão das telas: área segura, rolagem, "puxar para atualizar"
 * e ajuste de teclado em formulários.
 */
export function Tela({ children, rolavel = true, decorada = false, formulario = false, aoAtualizar, atualizando = false, estiloConteudo, bordas = ['top'] }) {
  const conteudo = rolavel ? (
    <ScrollView
      contentContainerStyle={[estilos.conteudo, estiloConteudo]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={aoAtualizar ? <RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={cores.primaria} /> : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[estilos.conteudo, estilos.fixo, estiloConteudo]}>{children}</View>
  );

  return (
    <SafeAreaView style={estilos.raiz} edges={bordas}>
      {decorada && <FundoDecorativo />}
      {formulario ? (
        <KeyboardAvoidingView style={estilos.raiz} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {conteudo}
        </KeyboardAvoidingView>
      ) : conteudo}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: espaco.xl, paddingBottom: espaco.xxxl, gap: espaco.lg },
  fixo: { flex: 1 },
  bolha: { position: 'absolute', borderRadius: 999, backgroundColor: cores.primariaSuave, opacity: 0.8 },
});
