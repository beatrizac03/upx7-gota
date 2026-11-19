import { criarRepositorios } from './repositorios/index.js';
import { criarBarramento } from './eventos/barramento.js';
import { TarifaServico } from './servicos/tarifa.servico.js';
import { CalculadoraConsumo } from './servicos/calculadoraConsumo.js';
import { AutenticacaoServico } from './servicos/autenticacao.servico.js';
import { ResidenciaServico } from './servicos/residencia.servico.js';
import { DispositivoServico } from './servicos/dispositivo.servico.js';
import { RegrasAlertaServico } from './servicos/regrasAlerta.servico.js';
import { LeituraServico } from './servicos/leitura.servico.js';
import { IngestaoServico } from './servicos/ingestao.servico.js';
import { AlertaServico } from './servicos/alerta.servico.js';
import { ConsumoServico } from './servicos/consumo.servico.js';
import { DicaServico } from './servicos/dica.servico.js';
import { SimulacaoServico } from './servicos/simulacao.servico.js';

/**
 * Raiz de composição: monta repositórios e serviços com injeção de dependências.
 * Usada pelo servidor HTTP, pela carga inicial e pelos testes.
 */
export function criarContainer(opcoes = {}) {
  const repositorios = opcoes.repositorios ?? criarRepositorios(opcoes);
  const barramento = criarBarramento();

  const tarifaServico = new TarifaServico();
  const calculadora = new CalculadoraConsumo({ repositorios });
  const residenciaServico = new ResidenciaServico({ repositorios });
  const dispositivoServico = new DispositivoServico({ repositorios, barramento });
  const regrasAlerta = new RegrasAlertaServico({ repositorios, calculadora, tarifaServico, barramento });
  const leituraServico = new LeituraServico({ repositorios, regrasAlerta, barramento });
  const ingestaoServico = new IngestaoServico({ repositorios, leituraServico, dispositivoServico });

  const servicos = {
    autenticacao: new AutenticacaoServico({ repositorios }),
    residencia: residenciaServico,
    dispositivo: dispositivoServico,
    leitura: leituraServico,
    ingestao: ingestaoServico,
    simulacao: new SimulacaoServico({ repositorios, ingestaoServico, regrasAlerta }),
    alerta: new AlertaServico({ repositorios }),
    regrasAlerta,
    consumo: new ConsumoServico({ repositorios, calculadora, tarifaServico, residenciaServico }),
    dica: new DicaServico({ repositorios, calculadora, tarifaServico }),
    tarifa: tarifaServico,
  };

  return { repositorios, barramento, servicos };
}
