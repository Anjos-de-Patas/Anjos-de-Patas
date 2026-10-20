import { z } from 'zod';
export const recuperarSchema = z.object({ email: z.string().trim().email().max(254).transform(s => s.toLowerCase()) }).strict();
export const redefinirSchema = z.object({
    email: z.string().trim().email().max(254),
    codigo: z.string().regex(/^\d{6,10}$/),
    password: z.string().min(8).max(128)
}).strict();
