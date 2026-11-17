import { Router } from 'express';
import { validar } from '../middlewares/validar.js';
import { autenticarDispositivo, autenticarUsuario, carregarResidencia } from '../middlewares/autenticacao.js';
import { idParametroDto } from '../dtos/comum.dto.js';
import { cadastroDto, entrarDto } from '../dtos/autenticacao.dto.js';
import { atualizarResidenciaDto, criarResidenciaDto } from '../dtos/residencia.dto.js';
import { listarDispositivosDto, parearDispositivoDto } from '../dtos/dispositivo.dto.js';
import {
  ingestaoLeituraDto,
  ingestaoLoteDto,
  ingestaoSinalDto,
  listarLeiturasDto,
  registrarLeituraManualDto,
} from '../dtos/leitura.dto.js';
import { listarAlertasDto, marcarAlertaDto } from '../dtos/alerta.dto.js';
import { dicasDto, estimativaTarifaDto, historicoDto, simulacaoMetaDto } from '../dtos/consumo.dto.js';
import { criarAutenticacaoControlador } from '../controladores/autenticacao.controlador.js';
import { criarResidenciaControlador } from '../controladores/residencia.controlador.js';
import { criarDispositivoControlador } from '../controladores/dispositivo.controlador.js';
import { criarLeituraControlador } from '../controladores/leitura.controlador.js';
import { criarIngestaoControlador } from '../controladores/ingestao.controlador.js';
import { criarAlertaControlador } from '../controladores/alerta.controlador.js';
import { criarConsumoControlador } from '../controladores/consumo.controlador.js';

/** Todas as rotas da API, agrupadas por recurso. Documentação: backend/README.md */
export function criarRotas(servicos) {
  const rotas = Router();
  const usuario = autenticarUsuario(servicos);
  const comResidencia = [usuario, carregarResidencia(servicos)];

  const autenticacao = criarAutenticacaoControlador(servicos);
  const residencia = criarResidenciaControlador(servicos);
  const dispositivo = criarDispositivoControlador(servicos);
  const leitura = criarLeituraControlador(servicos);
  const ingestao = criarIngestaoControlador(servicos);
  const alerta = criarAlertaControlador(servicos);
  const consumo = criarConsumoControlador(servicos);

  rotas.get('/saude', (_req, res) => res.json({ status: 'ok', servico: 'gota-api', em: new Date().toISOString() }));

  // Autenticação
  rotas.post('/autenticacao/cadastro', validar({ corpo: cadastroDto }), autenticacao.cadastrar);
  rotas.post('/autenticacao/entrar', validar({ corpo: entrarDto }), autenticacao.entrar);
  rotas.get('/autenticacao/perfil', usuario, autenticacao.perfil);

  // Residência do usuário logado
  rotas.post('/residencias', usuario, validar({ corpo: criarResidenciaDto }), residencia.criar);
  rotas.get('/residencias/sugestao-meta', usuario, residencia.sugestaoMeta);
  rotas.get('/residencias/minha', ...comResidencia, residencia.obter);
  rotas.patch('/residencias/minha', ...comResidencia, validar({ corpo: atualizarResidenciaDto }), residencia.atualizar);

  // Medidores (leitores Gota) da residência
  rotas.get('/dispositivos', ...comResidencia, validar({ consulta: listarDispositivosDto }), dispositivo.listar);
  rotas.post('/dispositivos', ...comResidencia, validar({ corpo: parearDispositivoDto }), dispositivo.parear);
  rotas.get('/dispositivos/:id', ...comResidencia, validar({ parametros: idParametroDto }), dispositivo.obter);
  rotas.delete('/dispositivos/:id', ...comResidencia, validar({ parametros: idParametroDto }), dispositivo.remover);

  // Leituras
  rotas.get('/leituras', ...comResidencia, validar({ consulta: listarLeiturasDto }), leitura.listar);
  rotas.get('/leituras/ultima', ...comResidencia, leitura.ultima);
  rotas.post('/leituras', ...comResidencia, validar({ corpo: registrarLeituraManualDto }), leitura.registrarManual);

  // Ingestão: usada pelo hardware (leitor Gota) e pelo simulador
  const dispositivoAutenticado = autenticarDispositivo(servicos);
  rotas.post('/ingestao/leituras', validar({ corpo: ingestaoLeituraDto }), dispositivoAutenticado, ingestao.receberLeitura);
  rotas.post('/ingestao/leituras/lote', validar({ corpo: ingestaoLoteDto }), dispositivoAutenticado, ingestao.receberLote);
  rotas.post('/ingestao/sinal', validar({ corpo: ingestaoSinalDto }), dispositivoAutenticado, ingestao.sinal);

  // Consumo (todos os números das telas saem daqui)
  rotas.get('/consumo/resumo', ...comResidencia, consumo.resumo);
  rotas.get('/consumo/historico', ...comResidencia, validar({ consulta: historicoDto }), consumo.historico);
  rotas.get('/consumo/perspectiva', ...comResidencia, consumo.perspectiva);
  rotas.get('/consumo/simulacao-meta', ...comResidencia, validar({ consulta: simulacaoMetaDto }), consumo.simularMeta);

  // Alertas
  rotas.get('/alertas', ...comResidencia, validar({ consulta: listarAlertasDto }), alerta.listar);
  rotas.patch('/alertas/:id', ...comResidencia, validar({ parametros: idParametroDto, corpo: marcarAlertaDto }), alerta.marcarLido);
  rotas.post('/alertas/marcar-todos-lidos', ...comResidencia, alerta.marcarTodosLidos);

  // Dicas e tarifas
  rotas.get('/dicas', ...comResidencia, validar({ consulta: dicasDto }), consumo.dicas);
  rotas.get('/tarifas', consumo.tabelaTarifas);
  rotas.get('/tarifas/estimativa', validar({ consulta: estimativaTarifaDto }), consumo.estimarTarifa);

  return rotas;
}
