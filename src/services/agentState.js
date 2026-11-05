// Estado da conversa do assistente, guardado pelo próprio navegador entre mensagens.
// Na Netlify cada mensagem pode ser atendida por uma cópia diferente da função, então
// a memória do servidor não basta. O servidor assina o estado (HMAC-SHA256) para que
// ele não possa ser alterado no navegador, e o estado vence em 30 minutos. Nenhuma
// conversa é gravada no banco de dados.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const VALIDADE_MS = 30 * 60 * 1000;

function chave() {
    const segredo = process.env.ESTADO_ASSISTENTE_SEGREDO
        || process.env.SUPABASE_SERVICE_ROLE_KEY
        || process.env.GEMINI_API_KEY
        || 'execucao-local';
    return createHash('sha256').update('anjos-de-patas/estado-assistente/v1:' + segredo).digest();
}

const assinar = dados => createHmac('sha256', chave()).update(dados).digest('base64url');

export function selarEstado(conversaId, estado) {
    const dados = Buffer.from(JSON.stringify({ c: conversaId, t: Date.now(), e: estado })).toString('base64url');
    return `${dados}.${assinar(dados)}`;
}

// Devolve o estado somente se a assinatura confere, se pertence a esta conversa e se
// ainda está dentro da validade. Em qualquer outro caso devolve null.
export function abrirEstado(token, conversaId) {
    if (typeof token !== 'string' || typeof conversaId !== 'string') return null;
    const partes = token.split('.');
    if (partes.length !== 2) return null;
    const [dados, assinatura] = partes;
    const esperada = Buffer.from(assinar(dados));
    const recebida = Buffer.from(assinatura);
    if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) return null;
    try {
        const valor = JSON.parse(Buffer.from(dados, 'base64url').toString('utf8'));
        if (valor.c !== conversaId || typeof valor.t !== 'number' || Date.now() - valor.t > VALIDADE_MS) return null;
        return valor.e ?? null;
    } catch {
        return null;
    }
}
