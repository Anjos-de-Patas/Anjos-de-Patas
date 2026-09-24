import { supabase } from '../config/database.js';

// Público: Um interessado preenche o formulário de adoção no site
export async function cadastrarAdotante(req, res) {
  try {
    const { nome, email, telefone, endereco } = req.body;

    if (!nome || !email || !telefone) {
      return res.status(400).json({ erro: 'Nome, email e telefone são obrigatórios.' });
    }

    const { data, error } = await supabase
      .from('adotantes')
      .insert([{ nome, email, telefone, endereco }])
      .select();

    if (error) throw error;
    res.status(201).json({ sucesso: true, adotante: data[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ sucesso: false, erro: 'Este email já está registado num processo de adoção.' });
    }
    res.status(500).json({ sucesso: false, erro: error.message });
  }
}

// Protegido: A ONG lista todos os candidatos para análise
export async function listarAdotantes(req, res) {
  try {
    const { data, error } = await supabase
      .from('adotantes')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) throw error;
    res.status(200).json({ sucesso: true, adotantes: data });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
}

// Protegido: A ONG aprova ou reprova a candidatura
export async function atualizarStatusAdotante(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('adotantes')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ erro: 'Adotante não encontrado.' });

    res.status(200).json({ sucesso: true, adotante: data[0] });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
}