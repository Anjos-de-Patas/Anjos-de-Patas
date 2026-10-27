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
  imagem_url: z.string().trim().max(2048).refine((valor) => !valor || /^https?:\/\//i.test(valor) && z.string().url().safeParse(valor).success, 'Informe um link de imagem válido com http ou https.').nullable().optional(),
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
  data_resgate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a data no formato AAAA-MM-DD.')
    .refine(valor => {
      const data = new Date(`${valor}T00:00:00.000Z`);
      return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
    }, 'Informe uma data válida.')
    .refine(valor => valor <= new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }), 'A data do resgate não pode estar no futuro.'),
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

export const interesseSchema = z.object({
  animal_id: z.string().trim().min(1).max(40),
  nome: z.string().trim().min(3).max(120),
  email: z.string().trim().email().max(254).transform((s) => s.toLowerCase()),
  telefone: z.string().regex(/^\d{10,11}$/, 'Informe DDD e telefone com 10 ou 11 números.'),
  cidade: z.string().trim().min(2).max(120),
  mensagem: z.string().trim().max(1500).optional(),
  consentimento: z.literal(true, { errorMap: () => ({ message: 'Confirme a autorização de contato para continuar.' }) })
}).strict();

export const cadastroContaAdotanteSchema = z.object({
  nome: z.string().trim().min(3).max(120),
  email: z.string().trim().email().max(254).transform(s => s.toLowerCase()),
  password: z.string().min(8, 'Use uma senha com pelo menos 8 caracteres.').max(128),
  consentimento: z.literal(true)
}).strict();
