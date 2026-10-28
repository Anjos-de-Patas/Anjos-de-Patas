import { supabaseAdmin } from '../config/database.js';
const idValido = id => /^\d{1,20}$/.test(id) || /^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id);
const falha = res => res.status(503).json({ sucesso: false, erro: 'Não foi possível consultar ou salvar os dados. Tente novamente.' });
export async function listarInteressados(req, res) {
    const pagina = Math.max(1, Math.min(10000, parseInt(req.query.pagina, 10) || 1));
    let consulta = supabaseAdmin.from('adotantes')
        .select('id,nome,email,telefone,status,interesse,criado_em,etapa,versao', { count: 'exact' });
    if (req.query.etapa) {
        if (!['recebido','triagem','entrevista','aprovado','concluida','encerrado'].includes(req.query.etapa)) return res.status(400).json({ sucesso: false, erro: 'Etapa inválida.' });
        consulta = consulta.eq('etapa', req.query.etapa);
    }
    const busca = String(req.query.busca || '').slice(0,120).replace(/[\\"(),%_]/g, ' ').trim();
    if (busca) consulta = consulta.or(`nome.ilike."%${busca}%",email.ilike."%${busca}%",telefone.ilike."%${busca}%",interesse->>animal_nome.ilike."%${busca}%"`);
    const { data, error, count } = await consulta.order('criado_em', { ascending: false }).range((pagina - 1) * 20, pagina * 20 - 1);
    if (error) return falha(res);
    res.json({ sucesso: true, interessados: data, total: count, pagina });
}
export async function historicoInteressado(req, res) {
    if (!idValido(req.params.id)) return res.status(400).json({ sucesso: false, erro: 'Identificador inválido.' });
    const { data, error } = await supabaseAdmin.from('acompanhamento_eventos').select('id,etapa,tipo,nota,criado_em')
        .eq('adotante_id', req.params.id).order('criado_em', { ascending: false }).limit(100);
    if (error) return falha(res);
    res.json({ sucesso: true, eventos: data });
}
export async function atualizarAcompanhamento(req, res) {
    if (!idValido(req.params.id)) return res.status(400).json({ sucesso: false, erro: 'Identificador inválido.' });
    const { error } = await supabaseAdmin.rpc('registrar_acompanhamento', {
        p_id: req.params.id, p_versao: req.body.versao, p_etapa: req.body.etapa || null,
        p_tipo: req.body.tipo, p_nota: req.body.nota, p_autor: req.user.id
    });
    if (error?.code === '40001') return res.status(409).json({ sucesso: false, erro: 'Outro usuário alterou este cadastro. Atualize os dados antes de salvar.' });
    if (error?.code === 'P0001') return res.status(400).json({ sucesso: false, erro: 'Etapa inválida. A conclusão exige uma adoção registrada; cadastros concluídos não podem mudar de etapa.' });
    if (error) return falha(res);
    res.json({ sucesso: true });
}
