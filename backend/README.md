# Lumina API — Sprint 1

API REST para cadastro, login, criação de conversas e envio de mensagens com PostgreSQL e Gemini.

## Requisitos
- Node.js 20+ (recomendado)
- PostgreSQL/Neon
- Chave de API do Gemini para respostas de IA

## Configuração
1. `npm install`
2. Copie `.env.example` para `.env` e preencha `DATABASE_URL`, `JWT_SECRET` e `GEMINI_API_KEY`.
3. Execute o SQL de `sql/schema.sql` no banco de dados escolhido.
4. `npm run dev`
5. Verifique `GET http://localhost:3000/health`.

`JWT_SECRET` deve ser aleatório, longo e mantido fora do Git. Não compartilhe `.env`.

## Endpoints
- `POST /auth/register` `{ name, email, password }`
- `POST /auth/login` `{ email, password }` → `{ token, user }`
- `GET /auth/me` (Bearer token)
- `POST /auth/logout` (Bearer token; logout efetivo é limpar token no cliente)
- `GET /lumina/chats` (Bearer token)
- `POST /lumina/new-chat` `{ title? }` (Bearer token)
- `GET /lumina/chats/:chatId/messages` (Bearer token)
- `POST /lumina/chats/:chatId/messages` `{ content }` (Bearer token)
- `GET /health`

Erros de validação usam 400, e-mail duplicado 409, credenciais inválidas 401, recurso inexistente/não pertencente ao usuário 404 e falha do provedor IA 502.
