import { z } from 'zod';

export const agenteMensagemSchema = z.object({
  mensagem: z.string().trim().min(2, 'A mensagem deve ter pelo menos 2 caracteres.').max(1000, 'A mensagem deve ter no maximo 1000 caracteres.'),
  conversa_id: z.string().trim().max(100).optional()
});

export const buscarAnimaisArgsSchema = z.object({
  nome: z.string().trim().min(2).max(100).optional(),
  especie: z.enum(['cao', 'gato']).optional(),
  sexo: z.enum(['macho', 'femea']).optional(),
  porte: z.enum(['pequeno', 'medio', 'grande']).optional(),
  faixa_etaria: z.enum(['filhote', 'adulto', 'idoso']).optional(),
  convivencia_criancas: z.boolean().optional(),
  convivencia_outros_animais: z.boolean().optional()
}).strict();

export const detalhesAnimalArgsSchema = z.object({
  animal_id: z.union([z.string().min(1), z.number().int().positive()])
}).strict();
