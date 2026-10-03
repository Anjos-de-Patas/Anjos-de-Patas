const tabelasHistorico = ['resgates', 'registros_saude', 'vacinas', 'tratamentos'];

async function animalExiste(cliente, animalId) {
  const { data, error } = await cliente
    .from('animais')
    .select('id, situacao')
    .eq('id', animalId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function registrarNaTabela(req, res, tabela) {
  try {
    const { id: animalId } = req.params;
    const animal = await animalExiste(req.supabase, animalId);

    if (!animal) return res.status(404).json({ erro: 'Animal não encontrado.' });

    const { data, error } = await req.supabase
      .from(tabela)
      .insert([{ ...req.body, animal_id: animalId }])
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ sucesso: true, registro: data });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: 'Não foi possível registrar o histórico.' });
  }
}

export const registrarResgate = (req, res) => registrarNaTabela(req, res, 'resgates');
export const registrarSaude = (req, res) => registrarNaTabela(req, res, 'registros_saude');
export const registrarVacina = (req, res) => registrarNaTabela(req, res, 'vacinas');
export const registrarTratamento = (req, res) => registrarNaTabela(req, res, 'tratamentos');

export async function obterHistoricoAnimal(req, res) {
  try {
    const { id: animalId } = req.params;
    const animal = await animalExiste(req.supabase, animalId);

    if (!animal) return res.status(404).json({ erro: 'Animal não encontrado.' });

    const consultas = tabelasHistorico.map((tabela) =>
      req.supabase.from(tabela).select('*').eq('animal_id', animalId).order('criado_em', { ascending: false })
    );
    const resultados = await Promise.all(consultas);
    const erro = resultados.find((resultado) => resultado.error);

    if (erro) throw erro.error;

    const historico = Object.fromEntries(
      resultados.map((resultado, indice) => [tabelasHistorico[indice], resultado.data || []])
    );

    const { data: adocoes, error: erroAdocoes } = await req.supabase
      .from('adocoes')
      .select('*')
      .eq('animal_id', animalId)
      .order('data_adocao', { ascending: false });

    if (erroAdocoes) throw erroAdocoes;

    return res.status(200).json({ sucesso: true, animal, historico: { ...historico, adocoes: adocoes || [] } });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: 'Não foi possível consultar o histórico.' });
  }
}

export async function registrarAdocao(req, res) {
  const { animal_id: animalId, adotante_id: adotanteId } = req.body;
  let situacaoAnterior;

  try {
    const animal = await animalExiste(req.supabase, animalId);
    if (!animal) return res.status(404).json({ erro: 'Animal não encontrado.' });
    if (animal.situacao === 'adotado') {
      return res.status(409).json({ erro: 'Este animal já foi adotado.' });
    }
    situacaoAnterior = animal.situacao;

    const { data: adotante, error: erroAdotante } = await req.supabase
      .from('adotantes')
      .select('id, status')
      .eq('id', adotanteId)
      .maybeSingle();

    if (erroAdotante) throw erroAdotante;
    if (!adotante) return res.status(404).json({ erro: 'Adotante não encontrado.' });
    if (adotante.status === 'reprovado') {
      return res.status(400).json({ erro: 'O adotante está reprovado.' });
    }

    const { data: animalAtualizado, error: erroAtualizacao } = await req.supabase
      .from('animais')
      .update({ situacao: 'adotado' })
      .eq('id', animalId)
      .neq('situacao', 'adotado')
      .select()
      .single();

    if (erroAtualizacao) throw erroAtualizacao;
    if (!animalAtualizado) return res.status(409).json({ erro: 'O animal não está mais disponível.' });

    const { data: adocao, error: erroAdocao } = await req.supabase
      .from('adocoes')
      .insert([{ ...req.body }])
      .select()
      .single();

    if (erroAdocao) {
      await req.supabase.from('animais').update({ situacao: situacaoAnterior }).eq('id', animalId);
      throw erroAdocao;
    }

    return res.status(201).json({ sucesso: true, adocao, animal: animalAtualizado });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: 'Não foi possível registrar a adoção.' });
  }
}

export async function listarAdocoes(req, res) {
  try {
    const { data, error } = await req.supabase
      .from('adocoes')
      .select('*')
      .order('data_adocao', { ascending: false });

    if (error) throw error;
    return res.status(200).json({ sucesso: true, adocoes: data || [] });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: 'Não foi possível listar as adoções.' });
  }
}
