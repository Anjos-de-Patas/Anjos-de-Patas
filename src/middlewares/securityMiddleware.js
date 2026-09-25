import rateLimit from 'express-rate-limit';

export const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { sucesso: false, erro: 'Muitas tentativas de login. Tente novamente mais tarde.' }
});

export const limiteBuscaInteligente = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { sucesso: false, erro: 'Limite de buscas atingido. Tente novamente mais tarde.' }
});
