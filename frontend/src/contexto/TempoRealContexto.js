import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { TEMPO_REAL_URL } from '../config';
import { VISUAL_ALERTA } from '../componentes/CartaoAlerta';
import { navegarPara } from '../navegacao/referencia';
import { cores, espaco, raio, sombra } from '../tema';

const TempoRealContexto = createContext({ conectado: false });

const INTERVALO_ATUALIZACAO_MS = 4000;

/** Quais dados recarregar para cada evento do servidor. */
const INVALIDACOES = {
  'leitura:registrada': [['consumo'], ['leituras'], ['dicas']],
  'alerta:criado': [['alertas'], ['consumo', 'resumo']],
  'dispositivo:atualizado': [['dispositivos'], ['consumo', 'resumo']],
};

/**
 * Conexão WebSocket com o backend (equivalente ao Supabase Realtime).
 * Agrupa invalidações (no máximo uma recarga a cada 4 s) para não recarregar a tela a cada
 * evento do simulador. Reconecta com espera exponencial.
 */
export function ProvedorTempoReal({ token, children }) {
  const clienteConsultas = useQueryClient();
  const [conectado, setConectado] = useState(false);
  const [alertaRecente, setAlertaRecente] = useState(null);

  useEffect(() => {
    if (!token) return undefined;
    let socket;
    let tentativas = 0;
    let encerrado = false;
    let religar;
    let lote;
    const pendentes = new Map();

    // Acumula as novidades e recarrega no máximo uma vez a cada INTERVALO_ATUALIZACAO_MS.
    // A tela não precisa refletir cada leitura na hora; isso poupa requisições e evita "piscar".
    const invalidar = (listaChaves) => {
      for (const chave of listaChaves) pendentes.set(JSON.stringify(chave), chave);
      if (lote) return;
      lote = setTimeout(() => {
        lote = null;
        for (const chave of pendentes.values()) clienteConsultas.invalidateQueries({ queryKey: chave });
        pendentes.clear();
      }, INTERVALO_ATUALIZACAO_MS);
    };

    const conectar = () => {
      socket = new WebSocket(`${TEMPO_REAL_URL}?token=${encodeURIComponent(token)}`);
      socket.onopen = () => { tentativas = 0; setConectado(true); };
      socket.onmessage = ({ data }) => {
        try {
          const { evento, dados } = JSON.parse(data);
          if (INVALIDACOES[evento]) invalidar(INVALIDACOES[evento]);
          if (evento === 'alerta:criado') setAlertaRecente(dados);
        } catch { /* mensagem inválida: ignora */ }
      };
      socket.onclose = (evento) => {
        setConectado(false);
        if (encerrado || evento.code === 4401) return;
        religar = setTimeout(conectar, Math.min(30_000, 1000 * 2 ** tentativas++));
      };
    };

    conectar();
    return () => {
      encerrado = true;
      clearTimeout(religar);
      clearTimeout(lote);
      socket?.close();
    };
  }, [token, clienteConsultas]);

  return (
    <TempoRealContexto.Provider value={{ conectado }}>
      {children}
      <AvisoAlerta alerta={alertaRecente} aoFechar={() => setAlertaRecente(null)} />
    </TempoRealContexto.Provider>
  );
}

export const useTempoReal = () => useContext(TempoRealContexto);

/** Aviso que desliza do topo quando um alerta novo chega (vazamento, meta...). */
function AvisoAlerta({ alerta, aoFechar }) {
  const margens = useSafeAreaInsets();
  const deslocamento = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    if (!alerta) return undefined;
    Animated.spring(deslocamento, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    const temporizador = setTimeout(esconder, 7000);
    return () => clearTimeout(temporizador);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerta]);

  function esconder() {
    Animated.timing(deslocamento, { toValue: -200, duration: 250, useNativeDriver: true }).start(aoFechar);
  }

  if (!alerta) return null;
  const visual = VISUAL_ALERTA[alerta.tipo] ?? VISUAL_ALERTA.acima_meta;
  return (
    <Animated.View style={[estilos.aviso, { top: margens.top + espaco.sm, transform: [{ translateY: deslocamento }] }]}>
      <Pressable
        style={estilos.conteudo}
        onPress={() => { esconder(); navegarPara('Alertas'); }}
        accessibilityRole="alert"
        accessibilityLabel={`Novo alerta: ${alerta.titulo}`}
      >
        <View style={[estilos.icone, { backgroundColor: visual.fundo }]}>
          <Ionicons name={visual.icone} size={22} color={visual.cor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={estilos.titulo}>{alerta.titulo}</Text>
          <Text style={estilos.mensagem} numberOfLines={2}>{alerta.mensagem}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  aviso: { position: 'absolute', left: espaco.lg, right: espaco.lg, zIndex: 100 },
  conteudo: { flexDirection: 'row', gap: espaco.md, alignItems: 'center', padding: espaco.lg, backgroundColor: cores.superficie, borderRadius: raio.lg, borderWidth: 1, borderColor: cores.borda, ...sombra, shadowOpacity: 0.15, elevation: 8 },
  icone: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: 16, fontWeight: '700', color: cores.texto },
  mensagem: { fontSize: 14, color: cores.textoSecundario },
});
