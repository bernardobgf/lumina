export type User = { id: string; name: string; email: string; role: 'student' | 'admin' };
export type Chat = { id: string; title: string; created_at: string; updated_at: string };
export type Message = { id: string; sender: 'user' | 'lumina'; content: string; created_at: string };
