import { GoogleGenerativeAI } from '@google/generative-ai';

// Inicializa o cliente do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Utiliza o modelo rápido e eficiente
const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

// 1. Função que já existia (mantém o código que já tem aí)
export async function extrairCriteriosComGemini(texto) {
   // ... (o seu código atual de extração de JSON continua aqui) ...
}

// 2. NOVA FUNÇÃO: A Voz da ONG
export async function gerarRespostaAmigavel(textoUsuario, animaisEncontrados) {
  try {
    // Definimos a "personalidade" da IA e entregamos-lhe os dados
    const prompt = `
      Você é um atendente virtual muito simpático, empático e acolhedor da ONG de proteção animal "Anjos de Patas".
      Um possível adotante enviou a seguinte mensagem procurando um pet: "${textoUsuario}"
      
      Você buscou no banco de dados e encontrou os seguintes animais:
      ${JSON.stringify(animaisEncontrados)}
      
      Instruções de resposta:
      - Seja caloroso e humano, use emojis moderadamente.
      - Se a lista de animais estiver VAZIA: Diga educadamente que no momento não temos um animal com essas características exatas, mas encoraje a pessoa a conhecer os outros peludos disponíveis na ONG.
      - Se a lista tiver animais: Apresente cada um de forma carinhosa (destaque o nome, porte, idade e um traço do temperamento). Não liste como se fosse um robô lendo uma tabela.
      - Não invente informações que não estejam no JSON fornecido.
      - Responda em português do Brasil de forma natural.
    `;

    // Pedimos ao Gemini para gerar o texto
    const result = await model.generateContent(prompt);
    return result.response.text();

  } catch (error) {
    console.error('Erro ao gerar resposta amigável:', error);
    return "Aqui estão os animais que encontramos para você! Entre em contato conosco para agendar uma visita."; // Resposta de segurança caso a IA falhe
  }
}