import { agenteMensagemSchema } from '../schemas/agentSchemas.js';
import { executarAgente } from '../services/agentService.js';

export async function conversarComAgente(req, res, next) {
  const validacao = agenteMensagemSchema.safeParse(req.body);
  if (!validacao.success) {
    return res.status(400).json({
      sucesso: false,
      erro: 'Mensagem invalida.',
      detalhes: validacao.error.issues.map((issue) => ({
        campo: issue.path[0],
        mensagem: issue.message
      }))
    });
  }

  try {
    const resultado = await executarAgente(validacao.data.mensagem);
    return res.status(200).json({
      sucesso: true,
      conversa_id: validacao.data.conversa_id || null,
      ...resultado
    });
  } catch (error) {
    return next(error);
  }
}
