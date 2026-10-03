import { GoogleGenerativeAI } from '@google/generative-ai';
import { CriteriaSchema } from '../schemas/criteriaSchema.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

export async function extrairCriteriosComGemini(texto) {
  try {
    const prompt = `
      Analise o texto: "${texto}".
      Extraia os critérios de adoção e retorne APENAS um objeto JSON válido.
      Chaves: "especie" ("cao" ou "gato"), "sexo" ("macho" ou "femea"), "porte" ("pequeno", "medio" ou "grande"), "faixa_etaria" ("filhote", "adulto" ou "idoso"), "convivencia_criancas" (true/false), "convivencia_outros_animais" (true/false).
      Use null se não mencionado.
    `;
    const result = await model.generateContent(prompt);
    const respostaBruta = result.response.text();
    const jsonMatch = respostaBruta.match(/\{[\s\S]*\}/);

    if (!jsonMatch) return {};

    const validacao = CriteriaSchema.safeParse(JSON.parse(jsonMatch[0]));
    return validacao.success ? validacao.data : {};
  } catch (error) {
    console.error('Erro IA:', error);
    return {};
  }
}

export async function gerarRespostaAmigavel(textoUsuario, animaisEncontrados) {
  try {
    const prompt = `Você é um voluntário da ONG Anjos de Patas. O usuário disse: "${textoUsuario}". Animais encontrados: ${JSON.stringify(animaisEncontrados)}. Responda de forma empática e natural.`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    return "Encontramos alguns animais para você! Entre em contato para saber mais.";
  }
}