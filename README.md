# Lumina — Sprint 1 (código integrado)

Este pacote reúne uma implementação de referência para as histórias US01/RF01 (cadastro), US02/RF02 (login), US05/RF05–RF06 (mensagens no chat) e US06/RF07 (criação de conversa), mantendo React + TypeScript + Vite no frontend e Node.js + Express + PostgreSQL no backend.

## Estrutura
- `frontend/`: interface de autenticação e chat.
- `backend/`: API REST, JWT, bcrypt, persistência PostgreSQL e integração Gemini.
- `backend/sql/schema.sql`: esquema inicial do banco.

## Ordem de execução
1. Configure `backend/.env` a partir de `backend/.env.example`.
2. Execute `backend/sql/schema.sql` no PostgreSQL/Neon.
3. Em `backend/`, rode `npm install` e `npm run dev`.
4. Configure `frontend/.env` a partir de `frontend/.env.example`.
5. Em `frontend/`, rode `npm install` e `npm run dev`.

Consulte os READMEs de cada pasta para detalhes. Nunca envie `.env` ou chaves reais ao Git.

## Atenção antes da entrega acadêmica
Este é um pacote de código para integrar e validar localmente, não evidência de que os testes passaram. Rode build/lint, teste os cenários positivos e negativos, fixe o commit apresentado e atualize os resultados/evidências do relatório com o que realmente aconteceu. Confira os nomes de colunas/tabelas antes de aplicar em um banco já existente. `schema.sql` cria tabelas novas chamadas `chats` e `messages` e não migra automaticamente dados de uma tabela antiga `chat`.
