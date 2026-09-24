import dotenv from 'dotenv';
dotenv.config();

async function verificarModelos() {
  try {
    const resposta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const dados = await resposta.json();
    
    if (dados.models) {
      console.log("Modelos disponíveis para sua chave:");
      dados.models.forEach(m => console.log(m.name));
    } else {
      console.log("Erro na resposta:", dados);
    }
  } catch (erro) {
    console.error("Falha ao buscar modelos:", erro);
  }
}

verificarModelos();