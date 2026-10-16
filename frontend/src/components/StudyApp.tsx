import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { api, setToken } from "../lib/api";
import type { Chat, Message, User } from "../types";

type Props = { user: User; onLogout: () => void };
const greeting: Message = {
  id: "welcome",
  sender: "lumina",
  content:
    "Oi! Eu sou a Lumina, sua tutora de estudos. ✨\n\nMe conte o que você está estudando ou qual dúvida quer resolver hoje. Vamos aprender juntos, um passo de cada vez.",
  created_at: new Date().toISOString(),
};
export default function StudyApp({ user, onLogout }: Props) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    api
      .chats()
      .then(({ chats }) => setChats(chats))
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);
  async function openChat(chat: Chat) {
    setActiveChat(chat);
    setError("");
    try {
      const result = await api.messages(chat.id);
      setMessages(result.messages.length ? result.messages : [greeting]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar conversa.");
    }
    setMobileMenu(false);
  }
  async function newChat() {
    setError("");
    try {
      const { chat } = await api.createChat();
      setChats((prev) => [chat, ...prev]);
      setActiveChat(chat);
      setMessages([greeting]);
      setMobileMenu(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível criar conversa.",
      );
    }
  }
  async function send(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || busy) return;
    let chat = activeChat;
    setError("");
    setBusy(true);
    setDraft("");
    try {
      if (!chat) {
        const result = await api.createChat(content.slice(0, 50));
        chat = result.chat;
        setActiveChat(chat);
        setChats((prev) => [chat!, ...prev]);
      }
      const optimistic: Message = {
        id: crypto.randomUUID(),
        sender: "user",
        content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== "welcome"),
        optimistic,
      ]);
      const result = await api.sendMessage(chat.id, content);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimistic.id),
        result.userMessage,
        result.assistantMessage,
      ]);
      const updated = {
        ...chat,
        title:
          chat.title === "Nova conversa" ? content.slice(0, 50) : chat.title,
        updated_at: new Date().toISOString(),
      };
      setChats((prev) => [updated, ...prev.filter((c) => c.id !== chat!.id)]);
      setActiveChat(updated);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível enviar a mensagem.",
      );
    } finally {
      setBusy(false);
    }
  }
  function logout() {
    setToken(null);
    onLogout();
  }
  const sidebar = (
    <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>
      <div className="sidebar-top">
        <a className="brand" href="#inicio">
          <span className="brand-icon">
            <Sparkles size={19} />
          </span>
          lumina
        </a>
        <button
          className="icon-button mobile-close"
          onClick={() => setMobileMenu(false)}
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>
      </div>
      <button className="new-chat-button" onClick={newChat}>
        <Plus size={17} /> Nova conversa <span>⌘ K</span>
      </button>
      <div className="side-label">SEU ESPAÇO</div>
      <div className="chat-list">
        {chats.length === 0 ? (
          <p className="empty-chats">Suas conversas aparecerão aqui.</p>
        ) : (
          chats.map((chat) => (
            <button
              key={chat.id}
              className={`chat-link ${activeChat?.id === chat.id ? "active" : ""}`}
              onClick={() => openChat(chat)}
            >
              <MessageCircle size={16} />
              <span>{chat.title}</span>
            </button>
          ))
        )}
      </div>
      <div className="sidebar-bottom">
        <div className="user-avatar">{user.name.slice(0, 1).toUpperCase()}</div>
        <div className="user-meta">
          <strong>{user.name}</strong>
          <small>Estudante</small>
        </div>
        <button
          className="icon-button"
          onClick={logout}
          title="Sair"
          aria-label="Sair"
        >
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  );
  return (
    <div className="study-layout">
      {sidebar}
      <main className="study-main">
        <header className="study-header">
          <div className="header-left">
            <button
              className="icon-button desktop-toggle"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Alternar barra lateral"
            >
              {sidebarOpen ? (
                <PanelLeftClose size={19} />
              ) : (
                <PanelLeftOpen size={19} />
              )}
            </button>
            <button
              className="icon-button mobile-menu-button"
              onClick={() => setMobileMenu(true)}
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <span className="header-divider" />
            <span className="header-context">
              Espaço de estudos <span>/</span>{" "}
              <strong>{activeChat?.title || "Nova conversa"}</strong>
            </span>
          </div>
          <div className="status-pill">
            <span /> Tutora online
          </div>
        </header>
        <div className={`study-body ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
          {!activeChat && messages.length === 0 ? (
            <div className="welcome-area">
              <div className="welcome-symbol">
                <Sparkles size={27} />
              </div>
              <span className="eyebrow">SEU ESPAÇO DE APRENDIZADO</span>
              <h1>
                Olá, {user.name.split(" ")[0]}.<br />O que vamos{" "}
                <em>desvendar</em> hoje?
              </h1>
              <p>
                Uma boa pergunta pode ser o começo de uma grande descoberta.
              </p>
              <div className="suggestion-grid">
                <button
                  onClick={() =>
                    setDraft(
                      "Me explique a diferença entre mitose e meiose com exemplos.",
                    )
                  }
                >
                  <span>01</span>
                  <strong>Entender um conceito</strong>
                  <small>Aprenda uma matéria do zero</small>
                </button>
                <button
                  onClick={() =>
                    setDraft(
                      "Me ajude a montar um plano de estudos para o vestibular.",
                    )
                  }
                >
                  <span>02</span>
                  <strong>Organizar meus estudos</strong>
                  <small>Crie uma rotina realista</small>
                </button>
                <button
                  onClick={() =>
                    setDraft(
                      "Crie uma questão de vestibular de dificuldade média e explique a resposta.",
                    )
                  }
                >
                  <span>03</span>
                  <strong>Praticar para a prova</strong>
                  <small>Teste o que você aprendeu</small>
                </button>
              </div>
            </div>
          ) : (
            <div className="messages-area">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`message-row ${message.sender === "user" ? "from-user" : ""}`}
                >
                  <div
                    className={`message-avatar ${message.sender === "user" ? "student-avatar" : ""}`}
                  >
                    {message.sender === "user" ? (
                      user.name.slice(0, 1).toUpperCase()
                    ) : (
                      <Sparkles size={16} />
                    )}
                  </div>
                  <div className="message-content">
                    <div className="message-author">
                      {message.sender === "user" ? "Você" : "Lumina"}{" "}
                      <span>
                        {new Date(message.created_at).toLocaleTimeString(
                          "pt-BR",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </span>
                    </div>
                    <p>{message.content}</p>
                  </div>
                </article>
              ))}
              {busy && (
                <div className="message-row">
                  <div className="message-avatar">
                    <Sparkles size={16} />
                  </div>
                  <div className="typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
          {error && (
            <div className="inline-error" role="alert">
              {error}
              <button onClick={() => setError("")} aria-label="Fechar erro">
                <X size={15} />
              </button>
            </div>
          )}
          <div className="composer-wrap">
            <form className="composer" onSubmit={send}>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Escreva sua dúvida ou o que deseja estudar..."
                rows={2}
                maxLength={4000}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <div className="composer-bottom">
                <span>Shift + Enter para pular linha</span>
                <button
                  type="submit"
                  disabled={!draft.trim() || busy}
                  aria-label="Enviar mensagem"
                >
                  {busy ? "..." : <Send size={17} />}
                </button>
              </div>
            </form>
            <p className="disclaimer">
              A Lumina pode cometer erros. Confira informações importantes em
              materiais confiáveis.
            </p>
          </div>
        </div>
      </main>
      {mobileMenu && (
        <button
          className="mobile-scrim"
          onClick={() => setMobileMenu(false)}
          aria-label="Fechar menu"
        />
      )}
    </div>
  );
}
