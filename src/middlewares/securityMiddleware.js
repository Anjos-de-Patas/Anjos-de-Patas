import rateLimit from 'express-rate-limit';

export const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { sucesso: false, erro: 'Muitas tentativas de login. Tente novamente mais tarde.' }
});

// Limite próprio do assistente: uma conversa usa de 6 a 10 mensagens, e várias
// pessoas da ONG podem sair pelo mesmo endereço de internet.
export const limiteAssistente = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 80,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { sucesso: false, erro: 'Muitas mensagens em pouco tempo. Aguarde alguns minutos e tente novamente.' }
});

export const limiteBuscaInteligente = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { sucesso: false, erro: 'Limite de buscas atingido. Tente novamente mais tarde.' }
});
