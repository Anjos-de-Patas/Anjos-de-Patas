// Função agendada da Netlify: faz uma consulta leve ao Supabase todo dia.
// No plano gratuito, o Supabase pausa o projeto após 7 dias sem atividade no banco
// (aconteceu em 19/11/2026 e derrubou o site). Esta consulta mantém o projeto ativo.
import { supabase } from '../../src/config/database.js';

export default async () => {
    const { error } = await supabase.from('animais').select('id').limit(1);
    if (error) {
        console.error('[manter-banco-ativo] consulta falhou:', error.message);
        return new Response('erro', { status: 500 });
    }
    console.log('[manter-banco-ativo] banco respondeu');
    return new Response('ok');
};

// Todo dia às 09:00 UTC (06:00 em Brasília).
export const config = { schedule: '0 9 * * *' };
