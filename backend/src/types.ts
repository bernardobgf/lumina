import type { Request } from 'express';

export interface AuthUser { id: string; role: 'student' | 'admin' }
export interface AuthRequest extends Request { user?: AuthUser }
