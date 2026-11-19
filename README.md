# Gota: gestão residencial de água (UPX 7 · ODS 6)

Protótipo funcional do Gota. O leitor físico (ESP32-CAM + OCR) ainda não existe, então um **simulador** envia leituras no mesmo formato e para o mesmo endereço que o leitor real. O app não sabe de onde os dados vieram, e quando o hardware existir basta trocar o simulador por ele.

```
upx7-gota/
├── backend/    API Node.js (Express 5 + SQLite nativo do Node), simulador e carga inicial
└── frontend/   App React Native (Expo SDK 58)
```

## Como rodar

Pré-requisito: **Node.js 22.13 ou mais novo** (testado no 24). Não precisa instalar banco de dados, porque o SQLite já vem no Node.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env              # opcional: os valores padrão já funcionam
npm run carga-inicial             # cria a conta demo + ~6 meses de leituras de hora em hora
npm run dev                       # API em http://localhost:3333/api
```

A carga inicial leva cerca de 1 s e mostra o login demo: **demo@gota.app / gota123**.
Para recomeçar do zero: `npm run carga-inicial -- --reiniciar`.

### 2. App

```bash
cd frontend
npm install
npx expo start                    # pressione "a" (Android), "i" (iOS) ou "w" (navegador)
```

No celular com o **Expo Go**, o app descobre sozinho o IP do computador e chama a API na porta 3333. O celular e o computador precisam estar na mesma rede Wi-Fi. Se usar túnel ou outro endereço, crie `frontend/.env` com `EXPO_PUBLIC_API_URL=http://SEU_IP:3333/api`.

Na tela de login há o botão **"Usar conta de demonstração"**.

### 3. Simulador do leitor

**Pelo app (sem terminal):** aba **Medidor** → cartão **Simulação do leitor** → escolha o cenário e a velocidade → **Ligar simulação**. A simulação roda no servidor, passa pelo mesmo serviço de ingestão do hardware e desliga sozinha após 30 minutos. Velocidade *Normal* = 15 min simulados a cada 5 s; *Rápida* = 1 h simulada a cada 2 s.

**Pelo terminal (opcional, testa o caminho HTTP do hardware):**

```bash
cd backend
npm run simulador                                   # 15 min simulados a cada 5 s
npm run simulador -- --cenario=vazamento --passo=60 --intervalo=2
```

Durante a execução dá para trocar de cenário pelo teclado: **[n]** normal · **[p]** pico · **[v]** vazamento · **[o]** offline · **[q]** sair.

| Cenário | O que simula |
|---|---|
| `normal` | ~400 L/dia, com picos de manhã e à noite e zero de madrugada |
| `pico` | consumo ~1,9× maior, que passa da meta diária |
| `vazamento` | água correndo sem parar (~22 L/h), que gera o alerta entre 2h e 5h |
| `offline` | o leitor guarda as leituras na memória e envia **em lote** quando volta |

## Roteiro da demonstração

1. `npm run carga-inicial -- --reiniciar` e `npm run dev`. Abra o app já com o histórico carregado.
2. `npm run simulador`: o **Consumo hoje** sobe sozinho (indicador "ao vivo").
3. Aperte **[v]**: quando o relógio simulado passa das 5h, aparecem o aviso de **Possível vazamento**, o cartão vermelho 
 no Início e o número no sino.
4. Explique que, com o leitor real, os dados chegariam pelo mesmo caminho (`POST /api/ingestao/leituras`).
5. Para mostrar o alerta de **medidor offline**, rode a API com `LIMITE_OFFLINE_MINUTOS=1` no `.env` e aperte **[o]** no simulador. Ao voltar com **[n]**, as leituras guardadas são enviadas em lote.

> O tempo do simulador é acelerado, então o "hoje" do app é o dia da **última leitura recebida**. Assim o gráfico do dia acompanha o relógio simulado.

### Para quem vai só testar (sem terminal)

1. Abra o link do site (Vercel) ou o app.
2. Toque em **Já tenho conta** → **Usar conta de demonstração**.
3. Aba **Medidor** → **Simulação do leitor** → escolha **Vazamento** e **Rápida** → **Ligar simulação**.
4. Volte ao **Início**: o consumo de hoje sobe sozinho e, quando o relógio simulado passa das 5h, aparece o alerta de vazamento.

## Como a conta (R$) é estimada

- É sempre um valor **mensal** (água + esgoto). No mês em andamento é uma **projeção**: média diária dos dias completos × dias do mês. Meses fechados usam o consumo medido.
- Cálculo (em `backend/src/servicos/tarifa.servico.js`): **tarifa fixa de água + m³ de cada faixa × preço da faixa** (tarifa progressiva) e **esgoto = 80% do valor da água**.
- Os valores ficam em `backend/src/config/tarifas.json`. São **valores de referência** com a estrutura da Copasa (tarifa fixa + faixas), **não a tabela oficial**. Antes de apresentar valores em R$ como reais, atualize com a resolução ARSAE-MG vigente.
- No app, o link **"Como calculamos?"** (Início e Histórico) mostra a conta do mês faixa por faixa.

## Hospedagem

- **Site (Vercel):** projeto com *Root Directory* = `frontend` (usa `frontend/vercel.json`) e a variável `EXPO_PUBLIC_API_URL` = URL pública da API terminando em `/api`.
- **API (Render):** *New → Blueprint* apontando para este repositório (usa `render.yaml`). Com `CARGA_INICIAL_AUTOMATICA=true`, a conta demo e os 6 meses de dados são criados sozinhos quando o banco está vazio. No plano gratuito o disco não é persistente (a conta demo volta ao estado inicial quando o serviço reinicia) e o serviço "dorme" sem uso: o primeiro acesso pode levar ~1 minuto.

## Arquitetura do backend

```
rotas → middlewares (auth, validação) → controladores → serviços → repositórios → banco
                                              ↑             ↑
                                            DTOs (zod)   mapeadores (linha ↔ entidade ↔ resposta)
```

| Pasta | Responsabilidade |
|---|---|
| `src/rotas` | Todas as rotas, agrupadas por recurso |
| `src/controladores` | Recebem a requisição já validada e respondem com os mapeadores |
| `src/dtos` | Esquemas zod de entrada (corpo, query, parâmetros), com mensagens em português |
| `src/servicos` | Regras de negócio: consumo, tarifa, regras de alerta, ingestão, dicas |
| `src/mapeadores` | Conversão banco (snake_case) → entidade → DTO de resposta (camelCase) |
| `src/repositorios` | Acesso a dados. `contratos.js` define a interface; `sqlite/` implementa |
| `src/tempo-real` | WebSocket que avisa o app de novas leituras e alertas (no lugar do Supabase Realtime) |
| `src/tarefas` | Verificação periódica de dispositivos offline |
| `scripts/` | Carga inicial, simulador e perfil de consumo |

**Uma única fonte de números:** `servicos/calculadoraConsumo.js` calcula consumo do mês, média diária e projeção. Início, Histórico, Perspectiva, Meta e os alertas usam esse mesmo cálculo, o que corrige a inconsistência do protótipo anterior (Histórico com outubro maior que setembro e Início mostrando -12%). As comparações entre meses usam a **média diária**, porque o mês atual ainda está incompleto.

### Trocar SQLite por Supabase

Os serviços dependem só dos contratos em `src/repositorios/contratos.js`, e todos os métodos já são assíncronos.

1. Rode `backend/src/banco/supabase/migracoes/001_inicial.sql` no SQL Editor do Supabase. Ele cria o mesmo esquema e a função `agrupar_consumo`.
2. `npm install @supabase/supabase-js` e implemente os repositórios em `src/repositorios/supabase/`, reaproveitando os mapeadores.
3. No `.env`: `PROVEDOR_BANCO=supabase`, `SUPABASE_URL`, `SUPABASE_CHAVE_SERVICO`.

Controladores, serviços e o app não mudam. Se quiser, a ingestão pode virar a Edge Function `ingest-leitura` chamando a mesma lógica.

## API (`/api`)

Respostas de erro seguem sempre o formato `{ "erro": { "codigo", "mensagem", "detalhes" } }`. As listas paginadas retornam `{ "dados": [...], "paginacao": { pagina, limite, total, totalPaginas, temProxima } }`.

### App (cabeçalho `Authorization: Bearer <token>`)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/autenticacao/cadastro` | `{ nome, email, senha }` → `{ token, usuario, residencia }` |
| POST | `/autenticacao/entrar` | `{ email, senha }` → `{ token, usuario, residencia }` |
| GET | `/autenticacao/perfil` | Usuário e residência da sessão |
| POST | `/residencias` | Cadastra a residência `{ moradores, tipo, areaExterna, metaDiariaLitros? }` |
| GET / PATCH | `/residencias/minha` | Lê ou atualiza (moradores, meta, categoria tarifária, notificações...) |
| GET | `/residencias/sugestao-meta?moradores=4` | Faixa de meta sugerida |
| GET | `/dispositivos?pagina&limite&tipo` | Medidores da casa (paginado) |
| POST | `/dispositivos` | Pareia um leitor `{ nome, tipo: camera\|simulado }` e devolve a **chave** (só nesta resposta) |
| GET / DELETE | `/dispositivos/:id` | Detalhe ou remoção |
| GET | `/leituras?pagina&limite&origem&dispositivoId&de&ate&ordem` | Leituras (paginado e filtrável) |
| GET | `/leituras/ultima` | Última leitura |
| POST | `/leituras` | Leitura manual `{ leituraM3, lidoEm? }` |
| GET | `/consumo/resumo` | Tela Início: hoje, mês, conta, por pessoa, medidor, alerta de vazamento |
| GET | `/consumo/historico?agrupamento=mes\|dia\|hora&quantidade&dia` | Séries para os gráficos |
| GET | `/consumo/perspectiva` | Comparação com casas similares |
| GET | `/consumo/simulacao-meta?metaDiariaLitros=500` | Conta e economia com a meta |
| GET | `/alertas?pagina&limite&tipo&lido` | Alertas (paginado e filtrável) + total de não lidos |
| PATCH | `/alertas/:id` | `{ lido: true }` |
| POST | `/alertas/marcar-todos-lidos` | Marca todos como lidos |
| GET | `/simulacao` | Estado da simulação (ligada, cenário, relógio simulado) |
| POST | `/simulacao/iniciar` | `{ cenario: normal\|pico\|vazamento\|offline, velocidade: normal\|rapida }` |
| PATCH | `/simulacao` | Troca cenário e/ou velocidade com a simulação ligada |
| POST | `/simulacao/parar` | Desliga (e envia as leituras guardadas sem Wi-Fi) |
| GET | `/dicas?categoria=personalizadas\|todas` | Dicas calculadas a partir do consumo real |
| GET | `/tarifas` · `/tarifas/estimativa?litros=12000` | Tabela tarifária e cálculo da conta |

### Hardware (leitor Gota ou simulador)

Cabeçalho `X-Chave-Dispositivo: <chave do pareamento>`. Os nomes dos campos seguem o documento do projeto, para o firmware não precisar traduzir nada.

| Método | Rota | Corpo |
|---|---|---|
| POST | `/ingestao/leituras` | `{"device_id":"gota-001","timestamp":"2026-11-16T07:00:00-03:00","leitura_m3":225.613,"bateria":82,"confianca":0.97}` |
| POST | `/ingestao/leituras/lote` | `{"device_id":"gota-001","leituras":[{timestamp, leitura_m3, bateria, confianca}, ...]}`: leituras guardadas enquanto o leitor estava sem Wi-Fi |
| POST | `/ingestao/sinal` | `{"device_id":"gota-001","bateria":80}`: "estou vivo"; devolve a última leitura para o leitor validar o OCR |

O que o servidor faz em cada leitura:
- **Reenvio** da mesma leitura (mesmo dispositivo e horário): responde `duplicada` sem gravar de novo.
- **Leitura menor que a anterior** (erro de OCR): é recusada com `LEITURA_MENOR_QUE_ANTERIOR`.
- **`confianca` abaixo de `CONFIANCA_MINIMA`** (0,8): é recusada, e o leitor tira outra foto.
- **Leitura que chega fora de ordem** (vinda do lote): o consumo da leitura seguinte é recalculado.

**Tempo real:** `ws://<host>:3333/tempo-real?token=<jwt>` envia os eventos `leitura:registrada`, `alerta:criado` e `dispositivo:atualizado`.

## Regras de alerta

| Tipo | Regra | Quando é avaliada |
|---|---|---|
| `acima_meta` | consumo do dia > meta diária (no máximo 1 por dia) | a cada leitura, se a residência ativou a notificação |
| `vazamento` | consumo > 0 nas três horas entre 2h e 5h | a partir da leitura das 5h (leituras automáticas) |
| `parabens` | mês fechado com média diária menor que a do mês anterior | na primeira leitura do mês novo |
| `dispositivo_offline` | nenhuma leitura há mais de `LIMITE_OFFLINE_MINUTOS` (padrão 12 h) | tarefa periódica no servidor |

"Nova leitura registrada" deixou de ser alerta, porque as leituras agora são automáticas.

## App (frontend)

- **Navegação** em três fluxos decididos pela sessão: boas-vindas/login → cadastro inicial (residência → conectar medidor → meta) → app com abas (Início, Histórico, Medidor, Dicas, Mais).
- **Componentes reutilizáveis** em `src/componentes`: `Tela`, `Cabecalho`, `Botao`, `CampoTexto`, `Cartao`, `Etiqueta`, `GraficoBarras`, `DigitosHidrometro`, `OpcoesSegmentadas`, `ModalOpcoes`, `CartaoAlerta`...
- **Desempenho:** React Query (cache, deduplicação e paginação infinita), `FlatList` com rolagem infinita para leituras e alertas, componentes memoizados, gráfico feito com `View` (sem biblioteca pesada) e eventos de tempo real agrupados em janelas de 400 ms.
- **Login:** teclado de e-mail, "próximo" leva à senha, "entrar" no teclado envia, erros aparecem no próprio campo, há botão de mostrar senha e atalho para a conta demo. O token fica no cofre seguro do aparelho (`expo-secure-store`).

## Testes

```bash
cd backend && npm test      # tarifa, ingestão, regras de alerta, consistência entre telas e fluxo HTTP completo
cd frontend && npx eslint .
```

## Limitações e trabalhos futuros

- Os valores da tarifa em `backend/src/config/tarifas.json` são **de referência**. Atualize com a resolução ARSAE-MG vigente.
- O pareamento Wi-Fi ("Gota-Setup") é simulado na interface. O registro do dispositivo e a chave são reais.
- Fora do escopo do protótipo: montagem do leitor, firmware da ESP32-CAM, OCR real, parceria com a Copasa e notificações push em produção.
