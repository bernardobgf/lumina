import type { Chat, Message, User } from "../types";

const API_URL = (
  import.meta.env.API_URL ?? "https://lumina-3il0.onrender.com"
).replace(/\/$/, "");
let token = localStorage.getItem("lumina_token");
export function setToken(value: string | null) {
  token = value;
  if (value) localStorage.setItem("lumina_token", value);
  else localStorage.removeItem("lumina_token");
}
export function getToken() {
  return token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error(
      "Não foi possível conectar à API. Confira se o backend está em execução.",
    );
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      body.error || body.message || "Ocorreu um erro inesperado.",
    );
  return body as T;
}

export const api = {
  me: () => request<{ user: User }>("/auth/me"),
  register: (data: { name: string; email: string; password: string }) =>
    request<{ message: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  chats: () => request<{ chats: Chat[] }>("/lumina/chats"),
  createChat: (title = "Nova conversa") =>
    request<{ chat: Chat }>("/lumina/new-chat", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  messages: (chatId: string) =>
    request<{ messages: Message[] }>(`/lumina/chats/${chatId}/messages`),
  sendMessage: (chatId: string, content: string) =>
    request<{ userMessage: Message; assistantMessage: Message }>(
      `/lumina/chats/${chatId}/messages`,
      { method: "POST", body: JSON.stringify({ content }) },
    ),
};
