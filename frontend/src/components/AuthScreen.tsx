import { useState, type FormEvent } from 'react';
import { ArrowRight, BookOpen, Eye, EyeOff, Sparkles } from 'lucide-react';
import { api, setToken } from '../lib/api';
import type { User } from '../types';

type Props = { onAuthenticated: (user: User) => void };
export default function AuthScreen({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      if (mode === 'register') await api.register({ name, email, password });
      const result = await api.login({ email, password }); setToken(result.token); onAuthenticated(result.user);
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível entrar.'); }
    finally { setBusy(false); }
  }
  return <main className="auth-layout">
    <section className="auth-story"><a className="brand" href="#inicio"><span className="brand-icon"><Sparkles size={20}/></span>lumina</a><div className="story-copy"><span className="eyebrow">SEU PRÓXIMO CAPÍTULO COMEÇA AQUI</span><h1>Seu potencial<br/>merece <em>espaço.</em></h1><p>Estude no seu ritmo, tire dúvidas e transforme pequenas sessões em grandes conquistas.</p><div className="story-note"><span className="note-icon"><BookOpen size={18}/></span><span><strong>Aprender com propósito</strong><small>Um passo de cada vez. Sem pressão.</small></span></div></div><div className="story-footer">Feito para quem acredita no próprio futuro.</div><div className="decor decor-one"/><div className="decor decor-two"/></section>
    <section className="auth-panel"><div className="auth-card"><div className="mobile-brand"><span className="brand-icon"><Sparkles size={18}/></span>lumina</div><span className="eyebrow">BEM-VINDO À LUMINA</span><h2>{mode === 'login' ? 'Que bom ter você de volta.' : 'Vamos começar sua jornada.'}</h2><p className="muted">{mode === 'login' ? 'Entre na sua conta para continuar estudando.' : 'Crie sua conta gratuita e comece a aprender.'}</p>
      <div className="auth-switch"><button className={mode === 'login' ? 'selected' : ''} onClick={() => {setMode('login');setError('')}} type="button">Entrar</button><button className={mode === 'register' ? 'selected' : ''} onClick={() => {setMode('register');setError('')}} type="button">Criar conta</button></div>
      <form onSubmit={submit} className="auth-form">{mode === 'register' && <label>Nome completo<input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Como podemos te chamar?" required minLength={2} maxLength={100}/></label>}<label>E-mail<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com" required maxLength={150}/></label><label>Senha<div className="password-wrap"><input type={showPassword?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres" required minLength={8} maxLength={72}/><button type="button" aria-label={showPassword?'Ocultar senha':'Mostrar senha'} onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>{error && <p className="error-message" role="alert">{error}</p>}<button className="primary-button" disabled={busy}>{busy?'Aguarde...':mode==='login'?'Entrar na minha conta':'Criar minha conta'}<ArrowRight size={17}/></button></form><p className="auth-terms">Ao continuar, você concorda em usar a Lumina de forma respeitosa e responsável.</p></div><span className="panel-footer">LUMINA · EDUCAÇÃO QUE ABRE CAMINHOS</span></section>
  </main>;
}
