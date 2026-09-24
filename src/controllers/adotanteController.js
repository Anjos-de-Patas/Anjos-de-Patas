import { supabase } from '../config/database.js';

// Rota Pública: O adotante preenche o formulário no site
export async function cadastrarAdotante(req, res) {
  try {
    const novoAdotante = req.body;

    const { data, error } = await supabase
      .from('adotantes')
      .insert([{
        nome: novoAdotante.nome,
        email: novoAdotante.email,
        telefone: novoAdotante.telefone,
        endereco: novoAdotante.endereco || null,
        status: 'em triagem' // Status inicial padrão
      }])
      .select();

    if (error) throw error;

    res.status(201).json({ sucesso: true, adotante: data[0] });
    
  } catch (error) {
    // 23505 é o código de erro do PostgreSQL para violação de regra UNIQUE (ex: email repetido)
    if (error.code === '23505') {
      return res.status(400).json({ sucesso: false, erro: 'Este email já está cadastrado no sistema.' });
    }
    res.status(500).json({ sucesso: false, erro: error.message });
  }
}

// Rota Protegida: A ONG lista todos os interessados
export async function listarAdotantes(req, res) {
  try {
    const { data, error } = await supabase
      .from('adotantes')
      .select('*')
      .order('criado_em', { ascending: false }); // Traz os mais recentes primeiro

    if (error) throw error;
    res.status(200).json({ sucesso: true, adotantes: data });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
}

// Rota Protegida: A ONG aprova ou reprova o adotante
export async function atualizarStatusAdotante(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ erro: 'O campo status é obrigatório.' });
    }

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