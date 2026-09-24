import { CriteriaSchema } from '../schemas/criteriaschema.js';
import { buscarAnimaisDisponiveis } from '../services/animalservice.js';
import { extrairCriteriosComGemini } from '../services/aiService.js'; // Importamos o novo serviço

export async function processarBuscaIA(req, res) {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ erro: 'O texto da pesquisa é obrigatório.' });
    }

    // 1. Chamada real à API do Gemini para interpretar a linguagem natural[cite: 1]
    const rawAiOutput = await extrairCriteriosComGemini(prompt);

    // 2. Validação dos critérios extraídos (Garante que a IA não alucinou atributos)[cite: 1]
    const parsedCriteria = CriteriaSchema.parse(rawAiOutput);

    // 3. Consulta estruturada à base de dados (PostgreSQL via Supabase)[cite: 1]
    const resultados = await buscarAnimaisDisponiveis(parsedCriteria);

    return res.status(200).json({
      sucesso: true,
      criterios_identificados: parsedCriteria,
      total_encontrado: resultados.length,
      animais: resultados
    });

  } catch (error) {
    console.error("Erro no processamento da IA:", error);
    return res.status(500).json({ 
      sucesso: false, 
      erro: 'Não foi possível processar a sua pesquisa. Tente novamente mais tarde.',
      detalhes: error.message 
    });
  }
}