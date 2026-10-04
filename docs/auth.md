# Autenticação (Sign In / Sign Out) e cadastro de usuário

Visão geral da autenticação baseada em JWT stateless com cookies `HttpOnly`.

## Endpoints

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | Público | Valida e-mail e senha, inicia a sessão e define os cookies de autenticação. Retorna `{ userId }`. |
| `POST` | `/auth/logout` | Público | Limpa os cookies de sessão e retorna `204 No Content`. |
| `GET` | `/auth/me` | Protegido | Retorna `{ userId }` da sessão atual a partir do cookie `accessToken`. |
| `POST` | `/users` | Público | Cadastra o usuário, inicia a sessão e retorna `{ userId }`. Sujeito a rate limiting. |

A documentação interativa (Scalar) está disponível em `/docs`.

## Tokens e cookies

Os tokens são gerados pelo plugin `@fastify/jwt` já existente no sistema, com **payload contendo o ID do usuário** (`sub`) e o e-mail.

| Cookie | Token | Validade | Segredo |
| --- | --- | --- | --- |
| `accessToken` | Access token | 1 hora | `JWT_SECRET` |
| `refreshToken` | Refresh token | 1 dia | `JWT_REFRESH_SECRET` (secredo dedicado, impedindo que um refresh token seja usado como access token) |

Configuração dos cookies:

- `HttpOnly`: sempre habilitado (proteção contra XSS).
- `SameSite=Lax`.
- `Secure`: habilitado em produção (`NODE_ENV=production`) ou quando `COOKIE_SECURE=true`.
- `Path=/`.

A sessão **não é persistida no banco de dados** (JWT stateless). O endpoint `/auth/me` existe porque os cookies `HttpOnly` não são legíveis via JavaScript; ele permite ao frontend restaurar a sessão após um refresh da página.

## Regras de negócio

- Credenciais inválidas (e-mail inexistente ou senha incorreta) retornam **401** com a mensagem genérica `"E-mail ou senha inválidos."` — a resposta não revela qual campo falhou.
- Quando o e-mail não existe, uma comparação bcrypt contra um hash fictício é executada para equalizar o tempo de resposta e dificultar a enumeração de usuários.
- Erros de formato (e-mail inválido, senha vazia) retornam **400** com mensagens em português (definidas no schema compartilhado `signInSchema`, do pacote `shared`).
- A rota `/auth/login` é pública; as demais rotas da API exigem um access token válido, verificado pelo middleware `authenticate` a partir do cookie (ou header `Authorization: Bearer`).
- O frontend envia credenciais nas requisições (`withCredentials`) e o CORS do backend permite credenciais para a origem configurada em `CORS_ORIGIN`.

## Cadastro de usuário (`POST /users`)

Cria a conta e já inicia a sessão do novo usuário. A sessão é criada pela **mesma função da feature de Login** (`createSession`), sem passar pela rota HTTP `/auth/login`, portanto os cookies e tokens são idênticos aos do login.

**Entrada:** `{ name, email, password, confirmPassword }`.

| Situação | Resposta |
| --- | --- |
| Sucesso | `201` com `{ userId }` e cookies de sessão (nenhum dado sensível na resposta) |
| Dados inválidos | `400` com os erros por campo |
| E-mail já cadastrado | `409` com o erro no campo `email` |
| Limite de requisições excedido | `429` com mensagem genérica |
| Falha inesperada | `500` com mensagem genérica, sem detalhes internos |

Formato dos erros:

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Este e-mail já está cadastrado.",
  "errors": [{ "field": "email", "message": "Este e-mail já está cadastrado." }]
}
```

`message` traz o resumo do erro e `errors` detalha cada campo inválido (`field` corresponde ao nome do campo em `createUserSchema`). O frontend exibe cada mensagem no campo correspondente.

### Regras de negócio

As regras abaixo são definidas uma única vez no schema `createUserSchema` do pacote `shared` e validadas no frontend (antes do envio) e no backend (na API):

- **Nome:** espaços das pontas são removidos; deve ter entre 3 e 100 caracteres (após o trim).
- **E-mail:** espaços das pontas são removidos e o valor é convertido para minúsculas antes da validação e da persistência.
- **Senha:** mínimo de 8 caracteres, máximo de 72 bytes (limite do bcrypt — a senha **não** é truncada) e ao menos 3 dos 4 tipos de caractere (maiúscula, minúscula, número e especial). A senha **não** é aparada nem alterada.
- **Confirmação de senha:** deve ser idêntica à senha. `confirmPassword` é enviado ao backend apenas para validação e nunca é persistido nem registrado em log.
- **E-mail único:** garantido pela verificação na aplicação e pelo índice único do banco. Colisões entre requisições simultâneas são tratadas como `409` (e-mail já cadastrado), nunca como erro genérico.
- **Senha no banco:** gravada somente como hash bcrypt, com custo definido por `BCRYPT_SALT_ROUNDS`.
- **Rate limiting:** a rota é limitada por IP para conter criação em massa e enumeração de e-mails (ver `SIGNUP_RATE_LIMIT_MAX`). O cadastro informa explicitamente que o e-mail já existe, decisão mitigada por esse limite.

### Rate limiting

O plugin `@fastify/rate-limit` é registrado com `global: false`: apenas as rotas que declaram `config.rateLimit` são limitadas. Os presets ficam em `apps/backend/src/config/rate-limit.ts`. Para novas rotas protegidas, basta adicionar uma entrada e referenciá-la em `config: { rateLimit: rateLimits.<chave> }`. Para limitar todas as rotas, altere `global: false` para `true` e isente as exceções com `config: { rateLimit: false }`.

## Frontend

- Feature `features/auth`: página de login (`/login`) com formulário React Hook Form + Zod (mensagens de erro exibidas por campo), estado de carregamento e mensagem genérica em caso de credenciais inválidas.
- Feature `features/users`: página de cadastro (`/register`) com nome, e-mail, senha e confirmação de senha. Usa o mesmo schema `createUserSchema` do `shared`, exibe os erros retornados pela API no campo correspondente, move o foco para o primeiro campo inválido, mantém nome e e-mail e limpa as senhas quando a requisição falha. O link "Não tem uma conta? Criar Conta" fica na tela de login e a tela de cadastro tem o link "Já tem uma conta? Entrar".
- Usuários já autenticados que acessam `/register` são redirecionados para o `/dashboard`.
- A sessão é gerenciada pelo store `authStore` (Zustand) e resolvida via `/auth/me` no `ProtectedRoute`, que protege `/dashboard`.
- O botão "Sair" (`SignOutButton`) chama `/auth/logout`, limpa o estado local e redireciona para `/login`. Sua posição final será definida pela feature de Dashboard.
- O link "Esqueci minha senha" está presente no login, sem lógica implementada por enquanto.

## Criando usuários para teste

O cadastro está disponível em `/register` (frontend) e em `POST /users` (API). Para criar um usuário diretamente no banco, sem passar pela interface (MongoDB precisa estar em execução):

```bash
pnpm --filter @renda-fixa-monitor/backend seed:user -- --email seu@email.com --password suaSenha --name "Seu Nome"
```

O script `apps/backend/scripts/seed-user.ts` faz upsert do usuário com a senha hashada via bcrypt.

## Variáveis de ambiente

Variáveis relacionadas (ver `apps/backend/.env.example`):

- `JWT_SECRET` — segredo do access token (obrigatório).
- `JWT_REFRESH_SECRET` — segredo do refresh token (obrigatório).
- `COOKIE_SECURE` — força o atributo `Secure` nos cookies (`false` por padrão em desenvolvimento).
- `BCRYPT_SALT_ROUNDS` — custo do hash bcrypt das senhas.
- `SIGNUP_RATE_LIMIT_MAX` — máximo de cadastros por janela de tempo (padrão `5`).
- `SIGNUP_RATE_LIMIT_WINDOW_MS` — janela do limite de cadastros em milissegundos (padrão `900000`, 15 minutos).
- `CORS_ORIGIN` — origem permitida com credenciais.