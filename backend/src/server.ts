import "dotenv/config";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import pool from "./database.js";
import { requireAuth, signToken } from "./auth.js";
import { generateTutorResponse } from "./ai.js";
import type { AuthRequest } from "./types.js";

const app = express();
const port = Number(process.env.PORT || 3000);
const allowedOrigins = (
  process.env.FRONTEND_ORIGIN || "https://lumina-53ek.vercel.app"
)
  .split(",")
  .map((v) => v.trim());
app.disable("x-powered-by");
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      return callback(new Error("Origem não permitida pelo CORS."));
    },
  }),
);
app.use(express.json({ limit: "20kb" }));

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "unavailable" });
  }
});

app.post(
  "/auth/register",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const name =
        typeof req.body?.name === "string" ? req.body.name.trim() : "";
      const email =
        typeof req.body?.email === "string"
          ? req.body.email.trim().toLowerCase()
          : "";
      const password =
        typeof req.body?.password === "string" ? req.body.password : "";
      if (name.length < 2 || name.length > 100)
        return res
          .status(400)
          .json({ error: "Nome deve ter entre 2 e 100 caracteres." });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150)
        return res.status(400).json({ error: "Informe um e-mail válido." });
      if (password.length < 8 || password.length > 72)
        return res
          .status(400)
          .json({ error: "A senha deve ter entre 8 e 72 caracteres." });
      const hash = await bcrypt.hash(password, 12);
      const result = await pool.query(
        "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role, created_at",
        [name, email, hash],
      );
      return res.status(201).json({
        message: "Cadastro realizado com sucesso.",
        user: result.rows[0],
      });
    } catch (error: any) {
      if (error?.code === "23505")
        return res
          .status(409)
          .json({ error: "Este e-mail já está cadastrado." });
      next(error);
    }
  },
);

app.post(
  "/auth/login",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const email =
        typeof req.body?.email === "string"
          ? req.body.email.trim().toLowerCase()
          : "";
      const password =
        typeof req.body?.password === "string" ? req.body.password : "";
      if (!email || !password)
        return res
          .status(400)
          .json({ error: "E-mail e senha são obrigatórios." });
      const result = await pool.query(
        "SELECT id, name, email, role, password_hash FROM users WHERE email = $1",
        [email],
      );
      const user = result.rows[0];
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: "E-mail ou senha incorretos." });
      }
      const token = signToken({ id: user.id, role: user.role });
      return res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

app.get("/auth/me", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [req.user!.id],
    );
    if (!result.rowCount)
      return res.status(404).json({ error: "Usuário não encontrado." });
    return res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

app.post("/auth/logout", requireAuth, (_req, res) =>
  res.json({ message: "Sessão encerrada no cliente." }),
);

app.get("/lumina/chats", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, title, created_at, updated_at FROM chats WHERE user_id = $1 ORDER BY updated_at DESC",
      [req.user!.id],
    );
    res.json({ chats: result.rows });
  } catch (error) {
    next(error);
  }
});

app.post(
  "/lumina/new-chat",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const title =
        typeof req.body?.title === "string"
          ? req.body.title.trim().slice(0, 120)
          : "Nova conversa";
      const result = await pool.query(
        "INSERT INTO chats (user_id, title) VALUES ($1, $2) RETURNING id, title, created_at, updated_at",
        [req.user!.id, title || "Nova conversa"],
      );
      res.status(201).json({ chat: result.rows[0] });
    } catch (error) {
      next(error);
    }
  },
);

app.get(
  "/lumina/chats/:chatId/messages",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const ownership = await pool.query(
        "SELECT id FROM chats WHERE id = $1 AND user_id = $2",
        [req.params.chatId, req.user!.id],
      );
      if (!ownership.rowCount)
        return res.status(404).json({ error: "Conversa não encontrada." });
      const result = await pool.query(
        "SELECT id, sender, content, created_at FROM messages WHERE chat_id = $1 ORDER BY created_at ASC",
        [req.params.chatId],
      );
      res.json({ messages: result.rows });
    } catch (error) {
      next(error);
    }
  },
);

app.post(
  "/lumina/chats/:chatId/messages",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    const content =
      typeof req.body?.content === "string" ? req.body.content.trim() : "";
    if (!content || content.length > 4000)
      return res
        .status(400)
        .json({ error: "A mensagem deve ter entre 1 e 4000 caracteres." });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const chat = await client.query(
        "SELECT id, title FROM chats WHERE id = $1 AND user_id = $2 FOR UPDATE",
        [req.params.chatId, req.user!.id],
      );
      if (!chat.rowCount) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Conversa não encontrada." });
      }
      const userMessage = await client.query(
        "INSERT INTO messages (chat_id, sender, content) VALUES ($1, $2, $3) RETURNING id, sender, content, created_at",
        [req.params.chatId, "user", content],
      );
      await client.query("COMMIT");
      let answer: string;
      try {
        answer = await generateTutorResponse(content);
      } catch (error) {
        console.error(
          "Falha no provedor de IA:",
          error instanceof Error ? error.message : "unknown",
        );
        return res.status(502).json({
          error:
            "Não foi possível obter resposta da tutora agora. Sua mensagem foi salva; tente novamente mais tarde.",
          userMessage: userMessage.rows[0],
        });
      }
      const assistantMessage = await pool.query(
        "INSERT INTO messages (chat_id, sender, content) VALUES ($1, $2, $3) RETURNING id, sender, content, created_at",
        [req.params.chatId, "lumina", answer],
      );
      await pool.query(
        "UPDATE chats SET updated_at = NOW(), title = CASE WHEN title = $2 THEN LEFT($3, 50) ELSE title END WHERE id = $1",
        [req.params.chatId, "Nova conversa", content],
      );
      return res.status(201).json({
        userMessage: userMessage.rows[0],
        assistantMessage: assistantMessage.rows[0],
      });
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* transaction may already be committed */
      }
      next(error);
    } finally {
      client.release();
    }
  },
);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(
    "Erro da API:",
    err instanceof Error ? err.message : "erro desconhecido",
  );
  if (res.headersSent) return;
  res.status(500).json({ error: "Erro interno do servidor." });
});

app.listen(port, () => console.log(`Lumina API disponível na porta ${port}`));
