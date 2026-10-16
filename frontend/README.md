# Lumina — frontend Sprint 1

Interface React + TypeScript para cadastro, login, criação de conversas e chat educacional.

## Rodar localmente
1. Instale Node.js compatível com Vite 8.
2. Execute `npm install`.
3. Copie `.env.example` para `.env` e configure `VITE_API_URL`.
4. Execute `npm run dev`.
5. Verifique qualidade/build com `npm run lint` e `npm run build`.

A API e o PostgreSQL precisam estar configurados. A sessão é restaurada consultando `GET /auth/me`. O frontend usa `localStorage` para guardar o JWT; em uma aplicação com requisitos de segurança mais rigorosos, prefira sessão com cookie `HttpOnly`, `Secure` e `SameSite` configurado pelo backend.
