import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../config/database.js';

export function criarClienteConta() {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
}
export const contaAdotanteAuth = { criarCliente: criarClienteConta };
export async function cadastrarContaAdotante(req, res) {
    const { nome, email, password } = req.body;
    const { error } = await contaAdotanteAuth.criarCliente().auth.signUp({ email, password, options: { data: { nome } } });
    if (error) return res.status(400).json({ sucesso: false, erro: 'Não foi possível concluir o cadastro. Confira os dados ou tente entrar se já possui conta.' });
    // Resposta igual para contas novas e existentes; nenhuma permissão administrativa é atribuída.
    res.status(201).json({ sucesso: true, mensagem: 'Solicitação recebida. Verifique seu e-mail para confirmar a conta, se solicitado, e depois entre com sua senha. Se já possui conta, utilize a opção Entrar.' });
}
export async function entrarContaAdotante(req, res) {
    const { data, error } = await contaAdotanteAuth.criarCliente().auth.signInWithPassword(req.body);
    if (error || !data.user || !data.session) return res.status(401).json({ sucesso: false, erro: 'Não foi possível entrar. Confira e-mail, senha e a confirmação do e-mail.' });
    if (!data.user.email_confirmed_at) return res.status(403).json({ sucesso: false, erro: 'Confirme seu e-mail antes de acessar a conta.' });
    res.json({ sucesso: true, token: data.session.access_token });
}
export async function verificarContaAdotante(req, res, next) {
    const token = req.headers.authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
    if (!token) return res.status(401).json({ sucesso: false, erro: 'Entre na sua conta para continuar.' });
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user?.email_confirmed_at || !data.user.email) return res.status(401).json({ sucesso: false, erro: 'Sessão inválida ou expirada. Entre novamente.' });
    // O e-mail vem da sessão validada no servidor, nunca de parâmetros enviados pelo navegador.
    req.contaAdotante = data.user;
    next();
}
export async function obterContaAdotante(req, res) {
    const user = req.contaAdotante;
    const { data, error } = await supabaseAdmin.from('adotantes')
        .select('id,status,interesse,criado_em,etapa').eq('email', user.email).maybeSingle();
    if (error) return res.status(503).json({ sucesso: false, erro: 'Não foi possível consultar seu cadastro. Tente novamente.' });
    let eventos = [];
    let adocao = null;
    if (data?.id) {
        const resultado = await supabaseAdmin.from('acompanhamento_eventos').select('etapa,criado_em')
            .eq('adotante_id', String(data.id)).eq('tipo', 'etapa').order('criado_em', { ascending: false }).limit(100);
        if (resultado.error) return res.status(503).json({ sucesso: false, erro: 'Não foi possível consultar as etapas. Tente novamente.' });
        eventos = (resultado.data || []).map(evento => ({ etapa: evento.etapa, criado_em: evento.criado_em }));
        if (data.etapa === 'concluida') {
            const registro = await supabaseAdmin.from('adocoes').select('animal_id,data_adocao')
                .eq('adotante_id', data.id).order('data_adocao', { ascending: false }).limit(1).maybeSingle();
            if (registro.error || !registro.data) return res.status(503).json({ sucesso: false, erro: 'Não foi possível consultar a adoção registrada. Tente novamente.' });
            const animal = await supabaseAdmin.from('animais').select('nome').eq('id', registro.data.animal_id).maybeSingle();
            if (animal.error) return res.status(503).json({ sucesso: false, erro: 'Não foi possível consultar a adoção registrada. Tente novamente.' });
            adocao = { animal_nome: animal.data?.nome || 'Animal adotado', data_adocao: registro.data.data_adocao };
        }
    }
    res.json({ sucesso: true, conta: { email: user.email, nome: user.user_metadata?.nome || '' },
        interesse: data ? {
            status: data.status,
            etapa: data.etapa || 'recebido',
            eventos,
            adocao,
            animal_nome: data.interesse?.animal_nome || null,
            criado_em: data.criado_em
        } : null });
}
