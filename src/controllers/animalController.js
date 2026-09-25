import { supabase } from '../config/database.js';
import { extrairCriteriosComGemini, gerarRespostaAmigavel } from '../services/aiService.js';

// Lista todos os animais (Catálogo Público)
export async function listarAnimais(req, res) {
  try {
    const { nome, especie, sexo, porte, faixa_etaria, situacao } = req.query;
    const cliente = req.supabase || supabase;
    let query = cliente
      .from('animais')
      .select('*')
      .order('criado_em', { ascending: false });

    if (nome) query = query.ilike('nome', `%${nome}%`);
    if (especie) query = query.eq('especie', especie);
    if (sexo) query = query.eq('sexo', sexo);
    if (porte) query = query.eq('porte', porte);
    if (faixa_etaria) query = query.eq('faixa_etaria', faixa_etaria);
    if (situacao) query = query.eq('situacao', situacao);
    if (!req.user && !situacao) query = query.eq('situacao', 'disponivel');

    const { data, error } = await query;

    if (error) throw error;
    res.status(200).json({ sucesso: true, animais: data });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
}

// Regista um novo animal (Requer Token e Validação Zod)
export async function cadastrarAnimal(req, res) {
  try {
    const novoAnimal = req.body;
    const cliente = req.supabase;
    
    const { data, error } = await cliente
      .from('animais')
      .insert([{
        nome: novoAnimal.nome,
        especie: novoAnimal.especie,
        sexo: novoAnimal.sexo,
        porte: novoAnimal.porte,
        faixa_etaria: novoAnimal.faixa_etaria,
        temperamento: novoAnimal.temperamento,
        convivencia_criancas: novoAnimal.convivencia_criancas,
        convivencia_outros_animais: novoAnimal.convivencia_outros_animais,
        situacao: novoAnimal.situacao || 'em tratamento'
      }])
      .select();

    if (error) throw error;
    res.status(201).json({ sucesso: true, animal: data[0] });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
}

// Atualiza informações de um animal (Requer Token e Validação Zod)
export async function atualizarAnimal(req, res) {
  try {
    const { id } = req.params;
    const dadosAtualizados = req.body;
    const cliente = req.supabase;

    const { data, error } = await cliente
      .from('animais')
      .update(dadosAtualizados)
      .eq('id', id)
      .select();

    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ erro: 'Animal não encontrado.' });
    
    res.status(200).json({ sucesso: true, animal: data[0] });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
}

// --- O CORAÇÃO DO MVP: Busca Inteligente ---
export async function buscaInteligente(req, res) {
  try {
    const { texto } = req.body;
    
    if (!texto) {
      return res.status(400).json({ erro: 'Envie um campo "texto" detalhando o que procura.' });
    }

    // 1. O Gemini interpreta o texto e devolve o JSON limpo
    const criterios = await extrairCriteriosComGemini(texto);

    // 2. Iniciamos a busca no Supabase APENAS por animais disponíveis para adoção
    let query = supabase
      .from('animais')
      .select('*')
      .eq('situacao', 'disponivel');

    // 3. Construtor Dinâmico: Se a IA encontrou um critério, adicionamos o filtro à busca
    if (criterios.especie) query = query.eq('especie', criterios.especie);
    if (criterios.sexo) query = query.eq('sexo', criterios.sexo);
    if (criterios.porte) query = query.eq('porte', criterios.porte);
    if (criterios.faixa_etaria) query = query.eq('faixa_etaria', criterios.faixa_etaria);
    
    // Para booleanos, precisamos garantir que o valor não é nulo/indefinido antes de filtrar
    if (criterios.convivencia_criancas !== null && criterios.convivencia_criancas !== undefined) {
      query = query.eq('convivencia_criancas', criterios.convivencia_criancas);
    }
    if (criterios.convivencia_outros_animais !== null && criterios.convivencia_outros_animais !== undefined) {
      query = query.eq('convivencia_outros_animais', criterios.convivencia_outros_animais);
    }

    // 4. Disparamos a consulta final para a base de dados
    const { data: animais, error } = await query;

    if (error) throw error;

    // 5. Pedir ao Gemini para escrever um texto humanizado com os resultados
    const mensagem_ia = await gerarRespostaAmigavel(texto, animais);

    // 6. Retornamos tudo para o front-end (Texto humanizado + Dados brutos)
    res.status(200).json({
      sucesso: true,
      mensagem: mensagem_ia,
      criterios_identificados: criterios,
      total_encontrado: animais.length,
      resultados: animais
    });

  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
}