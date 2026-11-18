import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { cores, espaco } from '../tema';

/**
 * Mostrador estilo hidrômetro: números pretos = m³, vermelhos = frações (litros).
 * Recebe as partes como texto para também servir de "teclado visual" na leitura manual.
 */
export const DigitosHidrometro = memo(function DigitosHidrometro({ inteiro = '', fracao = '', casasInteiras = 5, casasFracao = 3, compacto = false }) {
  const pretos = inteiro.padStart(casasInteiras, '0').slice(-casasInteiras).split('');
  const vermelhos = fracao.padEnd(casasFracao, '0').slice(0, casasFracao).split('');
  const tamanho = compacto ? estilos.digitoCompacto : null;

  return (
    <View style={estilos.raiz} accessibilityLabel={`Leitura ${Number(inteiro || 0)},${fracao || '0'} metros cúbicos`}>
      <View style={estilos.blocoPreto}>
        {pretos.map((d, i) => (
          <View key={i} style={[estilos.digitoPreto, tamanho]}>
            <Text style={[estilos.textoPreto, compacto && estilos.textoCompacto]}>{d}</Text>
          </View>
        ))}
      </View>
      <Text style={estilos.virgula}>,</Text>
      <View style={estilos.blocoVermelho}>
        {vermelhos.map((d, i) => (
          <View key={i} style={[estilos.digitoVermelho, tamanho]}>
            <Text style={[estilos.textoVermelho, compacto && estilos.textoCompacto]}>{d}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

const estilos = StyleSheet.create({
  raiz: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 4 },
  blocoPreto: { flexDirection: 'row', gap: 3, backgroundColor: '#111', borderRadius: 10, padding: 3 },
  blocoVermelho: { flexDirection: 'row', gap: 3, backgroundColor: cores.perigoSuave, borderRadius: 10, padding: 3 },
  digitoPreto: { width: 38, height: 58, borderRadius: 7, backgroundColor: '#3A3A3A', alignItems: 'center', justifyContent: 'center' },
  digitoVermelho: { width: 30, height: 58, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  digitoCompacto: { width: 26, height: 40 },
  textoPreto: { color: '#FFF', fontSize: 34, fontWeight: '500', fontVariant: ['tabular-nums'] },
  textoVermelho: { color: cores.perigo, fontSize: 30, fontWeight: '600', fontVariant: ['tabular-nums'] },
  textoCompacto: { fontSize: 22 },
  virgula: { fontSize: 34, fontWeight: '800', color: cores.texto, marginBottom: espaco.xs },
});
