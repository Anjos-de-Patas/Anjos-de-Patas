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

    const streaming = req.get('accept')?.includes('text/event-stream');
    const cancelamento = new AbortController();
    const emitir = (evento, dados) => {
        if (!res.destroyed && !res.writableEnded) res.write(`event: ${evento}\ndata: ${JSON.stringify(dados)}\n\n`);
    };
    if (streaming) {
        res.set({ 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' });
        res.flushHeaders();
        res.on('close', () => cancelamento.abort());
    }
    try {
        const conversaId =
            validacao.data.conversa_id || randomUUID();

        const resultado = await executarAgente(
            validacao.data.mensagem,
            conversaId,
            undefined,
            streaming ? { onDelta: texto => emitir('delta', { texto }), signal: cancelamento.signal } : {}
        );

        if (streaming) {
            emitir('done', { sucesso: true, conversa_id: conversaId, ...resultado });
            return res.end();
        }
        return res.status(200).json({
            sucesso: true,
            conversa_id: conversaId,
            ...resultado
        });
    } catch (error) {
        if (streaming) {
            emitir('error', { erro: 'Não consegui concluir a consulta. Tente novamente.' });
            return res.end();
        }
        if (error.code === 'ASSISTENTE_INDISPONIVEL') {
            return res.status(503).json({ sucesso: false, erro: error.message });
        }
        return next(error);
    }
}
