# Redis

Infraestrutura de conexão com o Redis no backend: configuração, ciclo de vida e as abstrações disponíveis para as features.

**Nenhuma funcionalidade usa Redis hoje.** A preparação existe para que as próximas features (por exemplo, a renovação de sessão) não precisem lidar com conexão, credenciais ou namespace de chaves.

## Arquitetura

| Arquivo | Responsabilidade |
| --- | --- |
| `src/config/env.ts` | Validação das variáveis `REDIS_*` na carga da configuração. |
| `src/config/redis.ts` | Criação do cliente, conexão, desconexão e `ping`. Único ponto que conhece a biblioteca `redis`. |
| `src/plugins/redis.ts` | Plugin Fastify: conecta no startup, decora `fastify.redis` e fecha no shutdown. |
| `src/infrastructure/redis.store.ts` | Interface `IRedisStore` e a implementação sobre o Node Redis, com o prefixo de chaves. |

O plugin é registrado por padrão em `buildServer` e pode ser desativado com `registerRedis: false`.

### Ciclo de vida

1. No startup, o plugin cria o cliente a partir da configuração e conecta.
2. O evento `error` do cliente tem listener: falhas de conexão não viram exceção não tratada.
3. O cliente é decorado em `fastify.redis` (tipado por module augmentation), mesmo quando a conexão falha, para a superfície da aplicação não variar em tempo de execução.
4. No shutdown, o hook `onClose` fecha a conexão. Clientes nunca conectados são ignorados, pois `close()` lança nesse estado.

### Comportamento quando o Redis está indisponível

Nenhuma feature depende de Redis, então **a API sobe e continua operando normalmente**, registrando um aviso no log. Isso é configurável:

| `REDIS_REQUIRED_ON_STARTUP` | Comportamento |
| --- | --- |
| `false` (padrão) | Loga o aviso e segue sem Redis. |
| `true` | Interrompe o startup com um erro explícito. |

O health check (`GET /health`) não verifica o Redis: ele continua reportando apenas a saúde da API, como antes.

## Variáveis de ambiente

Todas tem padrão e, portanto, nenhuma é obrigatória. A conexão usa `localhost:6379` quando nada é informado.

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `REDIS_HOST` | `localhost` | Host do Redis. |
| `REDIS_PORT` | `6379` | Porta (1–65535). |
| `REDIS_USERNAME` | — | Usuário ACL. Vazio equivale a ausente. |
| `REDIS_PASSWORD` | — | Senha. Vazio equivale a ausente. |
| `REDIS_DB` | `0` | Banco Redis. |
| `REDIS_TLS` | `false` | Habilita TLS. Mantenha `false` em desenvolvimento. |
| `REDIS_KEY_PREFIX` | `renda-fixa-monitor:` | Prefixo aplicado a todas as chaves. |
| `REDIS_CONNECT_TIMEOUT_MS` | `5000` | Tempo máximo de espera pela conexão. |
| `REDIS_RECONNECT_MAX_RETRIES` | `3` | Tentativas de reconexão antes de desistir. |
| `REDIS_RECONNECT_BASE_DELAY_MS` | `200` | Base do backoff exponencial entre reconexões (teto de 5000 ms). |
| `REDIS_REQUIRED_ON_STARTUP` | `false` | Faz o startup falhar sem Redis. |

Valores inválidos interrompem o startup com uma mensagem que **nomeia a variável, mas nunca imprime o valor** (por exemplo: `REDIS_PORT must be an integer between 1 and 65535.`).

### Segurança

- Nenhum dado de conexão é fixado no código: tudo vem das variáveis acima.
- Os logs informam apenas `host:porta`. Senha, usuário e URL completa nunca são registrados.
- O cliente e sua configuração não aparecem em respostas HTTP.
- Variáveis com segredo devem ficar apenas em `apps/backend/.env`, que é ignorado pelo Git. `.env.example` contém somente valores de exemplo.

## Executando localmente

O serviço já existe no `docker/docker-compose.yml`:

```bash
docker compose -f docker/docker-compose.yml up -d redis
```

Com o Redis no ar, `pnpm --filter backend dev` conecta e registra `Connected to Redis at localhost:6379`.

A API também sobe com o Redis parado — basta ignorá-lo e observar o aviso no log. Para simular Redis obrigatório e ver o startup falhar:

```bash
REDIS_REQUIRED_ON_STARTUP=true pnpm --filter backend dev
```

## Uso pelas features

As regras de negócio não devem chamar o cliente `redis` diretamente. Use a abstração, que já aplica o prefixo configurado:

```ts
import type { FastifyInstance } from "fastify";
import { loadEnvConfig } from "../config/env.js";
import { createNodeRedisStore, type IRedisStore } from "../infrastructure/redis.store.js";

export async function authRoutes(app: FastifyInstance, options: AuthRoutesOptions) {
  const redis: IRedisStore = createNodeRedisStore(
    app.redis,
    loadEnvConfig().redisKeyPrefix,
  );

  await redis.set("refresh-token:123", token, { ttlSeconds: 900 });
  const stored = await redis.get("refresh-token:123");
  await redis.del("refresh-token:123");
}
```

Operações disponíveis:

| Método | Retorno | Observação |
| --- | --- | --- |
| `get(key)` | `string \| null` | |
| `set(key, value, { ttlSeconds })` | `void` | Sem `ttlSeconds`, a chave não expira. |
| `del(key)` | `void` | Não falha quando a chave não existe. |
| `exists(key)` | `boolean` | |

Convenções:

- **Prefixo:** as features usam chaves lógicas (`refresh-token:123`). O prefixo é aplicado pela abstração e não deve ser escrito à mão, sob pena de duplicação.
- **Conexão em testes:** o plugin não conecta quando `NODE_ENV=test`, de modo que a suíte não depende de um Redis real. Para exercitar a conexão, use um teste dedicado com o módulo `redis` injetado, como em `apps/backend/src/tests/redis.plugin.test.ts`.
- **Falha em tempo de execução:** com `disableOfflineQueue`, comandos não ficam na fila aguardando o Redis voltar — eles falham na hora, e o listener de `error` registra o motivo. Trate a falha no ponto de uso.