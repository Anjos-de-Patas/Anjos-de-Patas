import { randomUUID } from 'node:crypto';

import { agenteMensagemSchema } from '../schemas/agentSchemas.js';
import { executarAgente } from '../services/agentService.js';

export async function conversarComAgente(req, res, next) {
    const validacao = agenteMensagemSchema.safeParse(req.body);

    if (!validacao.success) {
        return res.status(400).json({
            sucesso: false,
            erro: 'Mensagem inválida.',
            detalhes: validacao.error.issues.map((issue) => ({
                campo: issue.path[0],
                mensagem: issue.message
            }))
        });
    }

    try {
        const conversaId =
            validacao.data.conversa_id || randomUUID();

        const resultado = await executarAgente(
            validacao.data.mensagem,
            conversaId
        );

        return res.status(200).json({
            sucesso: true,
            conversa_id: conversaId,
            ...resultado
        });
    } catch (error) {
        return next(error);
    }
}