import { forwardRef, memo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cores, espaco, raio } from '../tema';

/** Campo com rótulo, ícone, mensagem de erro e botão de mostrar senha. */
export const CampoTexto = memo(forwardRef(function CampoTexto({ rotulo, icone, erro, senha = false, ...props }, ref) {
  const [focado, setFocado] = useState(false);
  const [visivel, setVisivel] = useState(false);

  return (
    <View style={estilos.raiz}>
      {rotulo ? <Text style={estilos.rotulo}>{rotulo}</Text> : null}
      <View style={[estilos.caixa, focado && estilos.focado, erro && estilos.comErro]}>
        {icone && <Ionicons name={icone} size={20} color={focado ? cores.primaria : cores.textoTerciario} />}
        <TextInput
          ref={ref}
          placeholderTextColor={cores.textoTerciario}
          accessibilityLabel={rotulo}
          {...props}
          style={estilos.entrada}
          secureTextEntry={senha && !visivel}
          onFocus={(e) => { setFocado(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocado(false); props.onBlur?.(e); }}
        />
        {senha && (
          <Pressable onPress={() => setVisivel((v) => !v)} hitSlop={10} accessibilityLabel={visivel ? 'Ocultar senha' : 'Mostrar senha'}>
            <Ionicons name={visivel ? 'eye-off-outline' : 'eye-outline'} size={22} color={cores.textoSecundario} />
          </Pressable>
        )}
      </View>
      {erro ? <Text style={estilos.erro} accessibilityLiveRegion="polite">{erro}</Text> : null}
    </View>
  );
}));

const estilos = StyleSheet.create({
  raiz: { gap: espaco.sm },
  rotulo: { fontSize: 15, fontWeight: '600', color: cores.texto },
  caixa: {
    flexDirection: 'row', alignItems: 'center', gap: espaco.md, minHeight: 56,
    paddingHorizontal: espaco.lg, borderRadius: raio.md, backgroundColor: cores.superficie,
    borderWidth: 1.5, borderColor: cores.borda,
  },
  focado: { borderColor: cores.primariaClara },
  comErro: { borderColor: cores.perigo },
  entrada: { flex: 1, fontSize: 17, color: cores.texto, paddingVertical: espaco.md },
  erro: { color: cores.perigo, fontSize: 14 },
});
