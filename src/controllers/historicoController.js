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
      .insert([{ ...req.body,
        ...(req.body.proxima_dose === '' ? { proxima_dose: null } : {}),
        ...(req.body.fim === '' ? { fim: null } : {}), animal_id: animalId }])
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ sucesso: true, registro: data });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: 'Não foi possível registrar o histórico.' });
  }
}

export const registrarResgate = (req, res) => registrarNaTabela(req, res, 'resgates');
export async function listarResgates(req, res) {
  try {
    const { data, error } = await req.supabase.from('resgates').select('*').order('data_resgate', { ascending: false });
    if (error) throw error;
    return res.json({ sucesso: true, resgates: data || [] });
  } catch {
    return res.status(500).json({ sucesso: false, erro: 'Não foi possível consultar os resgates.' });
  }
}
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
  try {
    const { data, error } = await req.supabase.rpc('registrar_adocao', {
      p_animal_id: String(req.body.animal_id),
      p_adotante_id: String(req.body.adotante_id),
      p_data: req.body.data_adocao,
      p_observacoes: req.body.observacoes || null
    });
    if (error) {
      const erros = {
        P0002: [404, 'Animal ou adotante não encontrado.'],
        P0001: [409, 'O animal não está disponível para adoção.'],
        '23505': [409, 'Este animal já possui adoção registrada.'],
        '22023': [400, 'Aprove o cadastro do adotante antes de registrar a adoção.'],
        '42501': [403, 'Usuário sem permissão para registrar adoção.']
      };
      const [status, mensagem] = erros[error.code] || [500, 'Não foi possível registrar a adoção.'];
      return res.status(status).json({ sucesso: false, erro: mensagem });
    }
    return res.status(201).json({ sucesso: true, adocao: data.adocao, animal: data.animal });
  } catch {
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
