import { GoogleGenAI } from '@google/genai';
import { CriteriaSchema } from '../schemas/criteriaSchema.js';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const MODELO = 'gemini-3.5-flash-lite';

export async function extrairCriteriosComGemini(texto) {
  try {
    const prompt = `
Analise o texto: "${texto}".

Extraia os criterios de adocao e retorne APENAS um objeto JSON valido.

Chaves:
- "especie": "cao" ou "gato"
- "sexo": "macho" ou "femea"
- "porte": "pequeno", "medio" ou "grande"
- "faixa_etaria": "filhote", "adulto" ou "idoso"
- "convivencia_criancas": true ou false
- "convivencia_outros_animais": true ou false

Use null quando uma caracteristica nao tiver sido mencionada.
`;

    const resposta = await ai.models.generateContent({
      model: MODELO,
      contents: prompt
    });

    const respostaBruta = resposta.text || '';
    const jsonMatch = respostaBruta.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return {};
    }

    const dados = JSON.parse(jsonMatch[0]);
    const validacao = CriteriaSchema.safeParse(dados);

    return validacao.success ? validacao.data : {};
  } catch (error) {
    console.error('Erro IA:', error);
    return {};
  }
}

export async function gerarRespostaAmigavel(
  textoUsuario,
  animaisEncontrados
) {
  try {
    const prompt = `
Voce e um voluntario da ONG Anjos de Patas.

O usuario disse:
"${textoUsuario}"

Animais encontrados:
${JSON.stringify(animaisEncontrados)}

Responda de forma empatica, natural, clara e objetiva.
Nao invente animais ou caracteristicas que nao estejam nos dados fornecidos.
`;

    const resposta = await ai.models.generateContent({
      model: MODELO,
      contents: prompt
    });

    return (
      resposta.text ||
      'Encontramos alguns animais para voce! Entre em contato para saber mais.'
    );
  } catch (error) {
    console.error('Erro ao gerar resposta amigavel:', error);

    return 'Encontramos alguns animais para voce! Entre em contato para saber mais.';
  }
}