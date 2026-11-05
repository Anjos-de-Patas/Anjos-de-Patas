import { randomUUID } from 'node:crypto';

import { agenteMensagemSchema } from '../schemas/agentSchemas.js';
import { executarAgente, falhaTemporaria, exportarEstadoConversa, restaurarEstadoConversa } from '../services/agentService.js';
import { executarConsultaGuiada, exportarSessaoGuiada, restaurarSessaoGuiada } from '../services/guidedAssistant.js';
import { abrirEstado, selarEstado } from '../services/agentState.js';

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
    let textoEnviado = false;
    const emitir = (evento, dados) => {
        if (evento === 'delta') textoEnviado = true;
        if (!res.destroyed && !res.writableEnded) res.write(`event: ${evento}\ndata: ${JSON.stringify(dados)}\n\n`);
    };
    if (streaming) {
        res.set({ 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' });
        res.flushHeaders();
        res.on('close', () => cancelamento.abort());
    }
    const conversaId = validacao.data.conversa_id || randomUUID();
    // O estado assinado que voltou do navegador tem prioridade sobre a memória desta
    // cópia da função, que pode ter sido reiniciada entre uma mensagem e outra.
    const estadoRecebido = abrirEstado(validacao.data.estado, conversaId);
    if (estadoRecebido) {
        restaurarEstadoConversa(conversaId, estadoRecebido.ia);
        restaurarSessaoGuiada(conversaId, estadoRecebido.guiado);
    }
    const resposta = resultado => ({
        sucesso: true,
        conversa_id: conversaId,
        ...resultado,
        estado: selarEstado(conversaId, { ia: exportarEstadoConversa(conversaId), guiado: exportarSessaoGuiada(conversaId) })
    });
    try {

        const resultado = await executarAgente(
            validacao.data.mensagem,
            conversaId,
            undefined,
            streaming ? { onDelta: texto => emitir('delta', { texto }), signal: cancelamento.signal } : {}
        );

        if (streaming) {
            emitir('done', resposta(resultado));
            return res.end();
        }
        return res.status(200).json(resposta(resultado));
    } catch (error) {
        if (falhaTemporaria(error) && !textoEnviado && !cancelamento.signal.aborted) {
            try {
                const guiado = await executarConsultaGuiada(validacao.data.mensagem, conversaId);
                if (streaming) {
                    emitir('done', resposta(guiado));
                    return res.end();
                }
                return res.status(200).json(resposta(guiado));
            } catch { /* segue para a resposta de erro abaixo */ }
        }
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
