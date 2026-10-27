import { supabase, supabaseAdmin } from '../config/database.js';

const camposPublicos = 'id,nome,especie,sexo,porte,faixa_etaria,temperamento,imagem_url,convivencia_criancas,convivencia_outros_animais,situacao';
const idValido = (id) => /^\d{1,20}$/.test(String(id)) || /^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(String(id));

export async function obterAnimalPublico(req, res) {
    if (!idValido(req.params.id)) return res.status(400).json({ sucesso: false, erro: 'Identificador de animal inválido.' });
    const { data, error } = await supabase.from('animais').select(camposPublicos).eq('id', req.params.id).eq('situacao', 'disponivel').maybeSingle();
    if (error) return res.status(503).json({ sucesso: false, erro: 'Não foi possível consultar o animal.' });
    if (!data) return res.status(404).json({ sucesso: false, erro: 'Este animal não está disponível para adoção.' });
    res.json({ sucesso: true, animal: data });
}

export async function manifestarInteresse(req, res) {
    const { animal_id, nome, email, telefone, cidade, mensagem } = req.body;
    if (!idValido(animal_id)) return res.status(400).json({ sucesso: false, erro: 'Identificador de animal inválido.' });
    // Revalida a disponibilidade no envio; o catálogo pode ter sido atualizado.
    const { data: animal, error: erroAnimal } = await supabaseAdmin.from('animais').select('id,nome').eq('id', animal_id).eq('situacao', 'disponivel').maybeSingle();
    if (erroAnimal) return res.status(503).json({ sucesso: false, erro: 'Não foi possível verificar a disponibilidade. Tente novamente.' });
    if (!animal) return res.status(409).json({ sucesso: false, erro: 'Este animal não está mais disponível para adoção.' });
    const { error } = await supabaseAdmin.from('adotantes').insert({
        nome, email, telefone, status: 'em triagem',
        interesse: { animal_id: String(animal.id), animal_nome: animal.nome, cidade, mensagem: mensagem || '', consentimento_em: new Date().toISOString() }
    });
    if (error?.code === '23505') return res.status(409).json({ sucesso: false, erro: 'Este e-mail já possui cadastro. Entre em contato com a ONG para acompanhar ou atualizar seu interesse.' });
    if (error) return res.status(503).json({ sucesso: false, erro: 'Não foi possível registrar o interesse. Tente novamente mais tarde.' });
    // Não devolve dados pessoais nem identificadores de adotantes pela rota pública.
    res.status(201).json({ sucesso: true });
}

export async function obterResultadosPublicos(req, res) {
    try {
        // Consultas retornam somente contagens, sem registros ou contatos.
        const consultas = await Promise.all([
            supabaseAdmin.from('animais').select('id', { count: 'exact', head: true }).neq('situacao', 'adotado'),
            supabaseAdmin.from('animais').select('id', { count: 'exact', head: true }).eq('situacao', 'disponivel'),
            supabaseAdmin.from('adocoes').select('id', { count: 'exact', head: true })
        ]);
        if (consultas.some(r => r.error || !Number.isSafeInteger(r.count) || r.count < 0)) {
            throw new Error('Contagens indisponíveis');
        }
        res.json({ sucesso: true, atualizado_em: new Date().toISOString(), dados: {
            animais_acolhidos: consultas[0].count,
            disponiveis: consultas[1].count,
            adocoes_registradas: consultas[2].count
        } });
    } catch {
        res.status(503).json({ sucesso: false, erro: 'Os indicadores estão temporariamente indisponíveis.' });
    }
}
