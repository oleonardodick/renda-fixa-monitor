# Autenticação (Sign In / Sign Out)

Visão geral da autenticação baseada em JWT stateless com cookies `HttpOnly`.

## Endpoints

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | Público | Valida e-mail e senha, inicia a sessão e define os cookies de autenticação. Retorna `{ userId }`. |
| `POST` | `/auth/logout` | Público | Limpa os cookies de sessão e retorna `204 No Content`. |
| `GET` | `/auth/me` | Protegido | Retorna `{ userId }` da sessão atual a partir do cookie `accessToken`. |

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

## Frontend

- Feature `features/auth`: página de login (`/login`) com formulário React Hook Form + Zod (mensagens de erro exibidas por campo), estado de carregamento e mensagem genérica em caso de credenciais inválidas.
- A sessão é gerenciada pelo store `authStore` (Zustand) e resolvida via `/auth/me` no `ProtectedRoute`, que protege `/dashboard`.
- O botão "Sair" (`SignOutButton`) chama `/auth/logout`, limpa o estado local e redireciona para `/login`. Sua posição final será definida pela feature de Dashboard.
- O link "Esqueci minha senha" está presente no login, sem lógica implementada por enquanto.

## Criando usuários para teste

Não há cadastro de usuários ainda. Para criar um usuário manualmente (MongoDB precisa estar em execução):

```bash
pnpm --filter @renda-fixa-monitor/backend seed:user -- --email seu@email.com --password suaSenha --name "Seu Nome"
```

O script `apps/backend/scripts/seed-user.ts` faz upsert do usuário com a senha hashada via bcrypt.

## Variáveis de ambiente

Variáveis relacionadas (ver `apps/backend/.env.example`):

- `JWT_SECRET` — segredo do access token (obrigatório).
- `JWT_REFRESH_SECRET` — segredo do refresh token (obrigatório).
- `COOKIE_SECURE` — força o atributo `Secure` nos cookies (`false` por padrão em desenvolvimento).
- `CORS_ORIGIN` — origem permitida com credenciais.