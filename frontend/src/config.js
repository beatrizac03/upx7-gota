import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Descobre o endereço da API automaticamente:
 * - EXPO_PUBLIC_API_URL tem prioridade (ex.: quando usar túnel ou servidor remoto);
 * - no celular com Expo Go, usa o mesmo IP do computador que roda o Metro;
 * - no navegador, usa o host da página.
 */
function hostPadrao() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.location.hostname;
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return hostUri.split(':')[0];
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || `http://${hostPadrao()}:3333/api`).replace(/\/$/, '');
export const TEMPO_REAL_URL = `${API_URL.replace(/^http/, 'ws').replace(/\/api$/, '')}/tempo-real`;

export const CONTA_DEMO = { email: 'demo@gota.app', senha: 'gota123' };
