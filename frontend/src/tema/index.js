/** Tokens de design extraídos das telas do protótipo. */
export const cores = {
  primaria: '#2F6FAE',
  primariaClara: '#5BA3D9',
  primariaSuave: '#EAF4FD',
  primariaTexto: '#1F5F9E',
  gota: '#6BB6EE',

  texto: '#0B1F44',
  textoSecundario: '#5B6B82',
  textoTerciario: '#8A97AA',

  fundo: '#F7F9FC',
  superficie: '#FFFFFF',
  borda: '#E6ECF3',
  campo: '#F1F4F8',

  sucesso: '#1E8E4E',
  sucessoSuave: '#E6F6EC',
  perigo: '#E53935',
  perigoSuave: '#FDECEC',
  aviso: '#B26A00',
  avisoSuave: '#FFF4E0',
  info: '#2F80ED',
  infoSuave: '#E8F1FD',
};

export const espaco = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

export const raio = { sm: 10, md: 14, lg: 20, xl: 24, pilula: 999 };

export const fonte = {
  tituloGrande: { fontSize: 32, fontWeight: '800', color: cores.texto, letterSpacing: -0.5 },
  titulo: { fontSize: 26, fontWeight: '800', color: cores.texto, letterSpacing: -0.3 },
  subtitulo: { fontSize: 18, fontWeight: '700', color: cores.texto },
  numeroGrande: { fontSize: 40, fontWeight: '800', color: cores.texto, letterSpacing: -1 },
  numero: { fontSize: 28, fontWeight: '800', color: cores.texto, letterSpacing: -0.5 },
  corpo: { fontSize: 16, color: cores.texto },
  corpoSecundario: { fontSize: 15, color: cores.textoSecundario, lineHeight: 21 },
  legenda: { fontSize: 13, color: cores.textoSecundario },
  rotulo: { fontSize: 15, fontWeight: '600', color: cores.texto },
};

export const sombra = {
  shadowColor: '#1B3A5C',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

export const gradientePrimario = ['#3570AC', '#5AA2D8'];
