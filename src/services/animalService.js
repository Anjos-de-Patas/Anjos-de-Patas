import { supabase } from '../config/database.js';

export async function buscarAnimaisDisponiveis(filtros = {}) {
  let query = supabase
    .from('animais')
    .select('*')
    .eq('situacao', 'disponivel'); // Filtra apenas animais disponíveis para adoção

  if (filtros.especie) {
    query = query.eq('especie', filtros.especie);
  }
  if (filtros.sexo) {
    query = query.eq('sexo', filtros.sexo);
  }
  if (filtros.porte) {
    query = query.eq('porte', filtros.porte);
  }
  if (filtros.faixa_etaria) {
    query = query.eq('faixa_etaria', filtros.faixa_etaria);
  }
  if (typeof filtros.convivencia_criancas === 'boolean') {
    query = query.eq('convivencia_criancas', filtros.convivencia_criancas);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao consultar a base de dados: ${error.message}`);
  }

  return data;
}