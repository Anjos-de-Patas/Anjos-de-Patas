import { createClient } from '@supabase/supabase-js';
function criarClienteConta() {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
}
export const recuperacaoAuth = { criarCliente: criarClienteConta };
export async function recuperarSenha(req, res) {
    const { error } = await recuperacaoAuth.criarCliente().auth.resetPasswordForEmail(req.body.email);
    if (error && !['user_not_found', 'email_not_found'].includes(error.code)) return res.status(503).json({ sucesso: false, erro: 'Não foi possível enviar a recuperação. Aguarde alguns minutos e tente novamente.' });
    res.json({ sucesso: true, mensagem: 'Se houver uma conta para esse e-mail, você receberá um código de recuperação. Confira também a caixa de spam.' });
}
export async function redefinirSenha(req, res) {
    const cliente = recuperacaoAuth.criarCliente();
    const { email, codigo, password } = req.body;
    const { data, error } = await cliente.auth.verifyOtp({ email, token: codigo, type: 'recovery' });
    if (error || !data.session) return res.status(400).json({ sucesso: false, erro: 'Código inválido ou expirado. Solicite uma nova recuperação.' });
    const { error: erroSenha } = await cliente.auth.updateUser({ password });
    if (erroSenha) return res.status(400).json({ sucesso: false, erro: 'Não foi possível alterar a senha. Use outra senha ou solicite um novo código.' });
    await cliente.auth.signOut({ scope: 'global' });
    res.json({ sucesso: true, mensagem: 'Senha alterada. Entre novamente com a nova senha.' });
}
