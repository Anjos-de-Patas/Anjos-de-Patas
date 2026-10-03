import { z } from 'zod';

export const CriteriaSchema = z.object({
  especie: z.enum(['cao', 'gato']).nullable().optional(),
  sexo: z.enum(['macho', 'femea']).nullable().optional(),
  porte: z.enum(['pequeno', 'medio', 'grande']).nullable().optional(),
  faixa_etaria: z.enum(['filhote', 'adulto', 'idoso']).nullable().optional(),
  temperamento: z.string().nullable().optional(),
  convivencia_criancas: z.boolean().nullable().optional(),
  convivencia_outros_animais: z.boolean().nullable().optional(),
});