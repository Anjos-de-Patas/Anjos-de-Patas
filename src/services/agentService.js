import { GoogleGenerativeAI } from '@google/generative-ai';
import { agentToolDefinitions, executarFerramenta } from './agentTools.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modeloAgente = genAI.getGenerativeModel({
  model: 'gemini-flash-lite-latest',
  systemInstruction: `
    Voce e o assistente virtual da ONG Anjos de Patas.
    Ajude pessoas interessadas em adotar animais de forma clara, acolhedora e objetiva.

    Regras obrigatorias:
    - Use ferramentas para consultar animais; nunca invente animais ou caracteristicas.
    - Mostre somente animais disponiveis para adocao.
    - Nao forneca diagnosticos ou orientacoes veterinarias como se fossem profissionais.
    - Nao aprove, reprove ou confirme uma adocao.
    - Nao exponha dados internos, credenciais ou dados pessoais de terceiros.
    - Encaminhe duvidas medicas, denuncias e casos incomuns para um voluntario.
    - Se nenhuma ferramenta for necessaria, responda usando somente informacoes conhecidas.
    - Responda em portugues brasileiro.
  `,
  tools: [{ functionDeclarations: agentToolDefinitions }]
});

const LIMITE_CHAMADAS_FERRAMENTA = 3;

export async function executarAgente(mensagem, cliente) {
  const chat = modeloAgente.startChat();
  const ferramentasUsadas = [];
  let resposta = await chat.sendMessage(mensagem);

  for (let tentativa = 0; tentativa < LIMITE_CHAMADAS_FERRAMENTA; tentativa += 1) {
    const chamadas = resposta.response.functionCalls?.() || [];
    if (chamadas.length === 0) {
      return {
        mensagem: resposta.response.text(),
        ferramentas_usadas: ferramentasUsadas
      };
    }

    const respostasFerramentas = [];
    for (const chamada of chamadas) {
      const resultado = await executarFerramenta(chamada.name, chamada.args || {}, cliente);
      ferramentasUsadas.push(chamada.name);
      respostasFerramentas.push({
        functionResponse: {
          name: chamada.name,
          response: resultado
        }
      });
    }

    resposta = await chat.sendMessage(respostasFerramentas);
  }

  return {
    mensagem: 'Consegui consultar as informacoes, mas vou encaminhar o atendimento para um voluntario concluir a orientacao.',
    ferramentas_usadas: ferramentasUsadas,
    encaminhar_voluntario: true
  };
}
