// src/schemas/validationSchemas.js
import { z } from 'zod';

export const animalSchema = z.object({
  nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  especie: z.enum(['cao', 'gato'], { 
    errorMap: () => ({ message: 'A espécie deve ser "cao" ou "gato".' }) 
  }),
  sexo: z.enum(['macho', 'femea'], {
    errorMap: () => ({ message: 'O sexo deve ser "macho" ou "femea".' })
  }),
  porte: z.enum(['pequeno', 'medio', 'grande']),
  faixa_etaria: z.enum(['filhote', 'adulto', 'idoso']),
  temperamento: z.string().min(5, 'Descreva o temperamento com pelo menos 5 caracteres.'),
  convivencia_criancas: z.boolean({
    required_error: 'Informe se convive bem com crianças (true/false).'
  }),
  convivencia_outros_animais: z.boolean({
    required_error: 'Informe se convive bem com outros animais (true/false).'
  }),
  situacao: z.enum(['disponivel', 'adotado', 'em tratamento']).optional()
});

export const adotanteSchema = z.object({
  nome: z.string().min(3, 'O nome completo é obrigatório.'),
  email: z.string().email('Forneça um endereço de email válido.'),
  telefone: z.string().min(10, 'O telefone deve ter o DDD e o número.'),
  endereco: z.string().optional()
});