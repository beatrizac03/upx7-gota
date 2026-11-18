import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { ProvedorSessao } from './src/contexto/SessaoContexto';
import { Navegacao } from './src/navegacao/Navegacao';

const clienteConsultas = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // evita recarregar ao trocar de aba; o tempo real invalida quando há novidade
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

/** No celular, "foco" = app voltou para o primeiro plano: atualiza os dados. */
function useFocoDoApp() {
  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    const assinatura = AppState.addEventListener('change', (estado) => focusManager.setFocused(estado === 'active'));
    return () => assinatura.remove();
  }, []);
}

export default function App() {
  useFocoDoApp();
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={clienteConsultas}>
        <ProvedorSessao>
          <StatusBar style="dark" />
          <Navegacao />
        </ProvedorSessao>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
