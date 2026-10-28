import { z } from 'zod';
export const etapas = ['recebido', 'triagem', 'entrevista', 'aprovado', 'concluida', 'encerrado'];
export const acompanhamentoSchema = z.object({
    etapa: z.enum(etapas).optional(),
    tipo: z.enum(['nota', 'contato']).default('nota'),
    nota: z.string().trim().max(3000).default(''),
    versao: z.number().int().nonnegative()
}).strict().refine(d => d.etapa || d.nota.length, 'Informe uma etapa ou anotação.');
