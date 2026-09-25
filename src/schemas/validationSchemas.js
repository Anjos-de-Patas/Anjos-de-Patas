import { z } from 'zod';

export const adotanteSchema = z.object({
  nome: z.string().trim().min(3, 'O nome deve ter pelo menos 3 letras.'),
  email: z.string().email('Formato de email inválido.'),
  telefone: z.string().regex(/^\d{10,11}$/, 'O telefone deve conter apenas entre 10 e 11 números.'),
  endereco: z.string().optional() // Recupera o campo descartado
});

export const statusAdotanteSchema = z.object({
  status: z.enum(['em triagem', 'aprovado', 'reprovado'], {
    errorMap: () => ({ message: "O status deve ser 'em triagem', 'aprovado' ou 'reprovado'." })
  })
});

export const situacaoAnimalSchema = z.enum(['em tratamento', 'disponivel', 'adotado']);

export const animalSchema = z.object({
  nome: z.string().trim().min(2),
  especie: z.enum(['cao', 'gato']),
  sexo: z.enum(['macho', 'femea']),
  porte: z.enum(['pequeno', 'medio', 'grande']),
  faixa_etaria: z.enum(['filhote', 'adulto', 'idoso']),
  temperamento: z.string().optional(),
  convivencia_criancas: z.boolean(),
  convivencia_outros_animais: z.boolean(),
  situacao: situacaoAnimalSchema.optional()
});

export const animalUpdateSchema = animalSchema.partial();

export const loginSchema = z.object({
  email: z.string().email('Formato de email inválido.'),
  password: z.string().min(1, 'A senha é obrigatória.')
});

export const buscaSchema = z.object({
  texto: z.string().trim().min(2).max(500, 'A busca deve ter no máximo 500 caracteres.')
});

export const resgateSchema = z.object({
  data_resgate: z.string().min(1),
  local_resgate: z.string().trim().min(2),
  motivo: z.string().trim().min(2),
  observacoes: z.string().optional()
});

export const saudeSchema = z.object({
  data_registro: z.string().min(1),
  descricao: z.string().trim().min(2),
  observacoes: z.string().optional()
});

export const vacinaSchema = z.object({
  nome: z.string().trim().min(2),
  data_aplicacao: z.string().min(1),
  proxima_dose: z.string().optional(),
  observacoes: z.string().optional()
});

export const tratamentoSchema = z.object({
  descricao: z.string().trim().min(2),
  inicio: z.string().min(1),
  fim: z.string().optional(),
  status: z.enum(['ativo', 'concluido', 'cancelado']).default('ativo'),
  observacoes: z.string().optional()
});

export const adocaoSchema = z.object({
  animal_id: z.union([z.string().min(1), z.number().int().positive()]),
  adotante_id: z.union([z.string().min(1), z.number().int().positive()]),
  data_adocao: z.string().min(1),
  observacoes: z.string().optional()
});