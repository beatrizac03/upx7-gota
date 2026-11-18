import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CHAVE = 'gota.token';

/** Token guardado no cofre seguro do aparelho (Keychain/Keystore); no navegador, localStorage. */
export const armazenamentoSessao = {
  async obterToken() {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(CHAVE) ?? null;
    return SecureStore.getItemAsync(CHAVE);
  },
  async salvarToken(token) {
    if (Platform.OS === 'web') return globalThis.localStorage?.setItem(CHAVE, token);
    return SecureStore.setItemAsync(CHAVE, token);
  },
  async limpar() {
    if (Platform.OS === 'web') return globalThis.localStorage?.removeItem(CHAVE);
    return SecureStore.deleteItemAsync(CHAVE);
  },
};
