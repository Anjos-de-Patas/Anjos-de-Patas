import { executarFerramenta } from './agentTools.js';
import {imagemPublica,miniaturaPublica} from './animalImages.js';

// Consulta guiada determinística: não chama modelo de IA nem inventa cadastros.
const sessoes=new Map();const EXPIRACAO=30*60*1000;const MAX_SESSOES=500;
const normalizar=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const publicos=animais=>(animais||[]).filter(a=>a.situacao==='disponivel').slice(0,3).map(a=>({id:a.id,nome:a.nome,especie:a.especie,porte:a.porte,faixa_etaria:a.faixa_etaria,situacao:a.situacao,imagem_url:imagemPublica(a.imagem_url),miniatura_url:miniaturaPublica(a.imagem_url)}));
function sessao(id){
    const agora=Date.now();for(const [chave,valor]of sessoes)if(agora-valor.hora>EXPIRACAO)sessoes.delete(chave);
    let valor=sessoes.get(id);if(!valor){if(sessoes.size>=MAX_SESSOES)sessoes.delete(sessoes.keys().next().value);valor={filtros:{},opcoes:[],hora:agora};sessoes.set(id,valor);}valor.hora=agora;return valor;
}
export async function executarConsultaGuiada(mensagem,conversaId,cliente){
    const texto=normalizar(mensagem),s=sessao(conversaId);
    const responder=(mensagem,animais=[])=>({mensagem,animais:publicos(animais),modo:'guiado',ferramentas_usadas:[]});
    if(/\b(voluntario|equipe|telefone|whatsapp|contato|atendente)\b/.test(texto))return responder('Os canais oficiais de contato ainda precisam ser cadastrados pela equipe. Consulte a seção Contato do site para verificar atualizações. Nenhum atendimento foi encaminhado automaticamente.');
    if(/\b(vacina|castrad|doente|remedio|medicamento|veterinario)\w*/.test(texto))return responder('As condições de saúde variam conforme o animal. Confirme vacinação, castração e cuidados necessários com a equipe. O chat não fornece diagnóstico ou tratamento veterinário.');
    if(/\b(dados|privacidade|documentos)\b/.test(texto))return responder('Informe seus dados somente no formulário de interesse, não no chat. A página Transparência explica o uso dos dados e a conta do adotante permite acompanhar o pedido com o mesmo e-mail.');
    if(/\b(senha|login|conta|acompanhar|acompanhamento)\b/.test(texto))return responder('Use Entrar para acessar a conta do adotante com o mesmo e-mail usado no formulário de interesse. Confirme seu e-mail para acompanhar o pedido. Para redefinir a senha, use a opção de recuperação na tela de acesso.');
    if(/\bnao\b.*\b(gato|gata|cao|cachorro|pequeno|medio|grande|filhote|adulto|idoso)\b/.test(texto))return responder('Para aplicar o filtro corretamente, diga a espécie ou o porte que você deseja. Você também pode pedir para ver todos os animais, sem filtros.');
    if(/\b(todos os animais|todo o catalogo|sem filtros)\b/.test(texto))s.filtros={};
    if(/\b(qualquer porte|tanto faz o porte)\b/.test(texto))delete s.filtros.porte;
    const nomeAnterior=s.opcoes.find(a=>texto.includes(normalizar(a.nome)));
    let escolha=nomeAnterior;
    if(/\b(primeir[ao]|segund[ao]|terceir[ao])\b/.test(texto)){const pos=/\bprimeir/.test(texto)?0:/\bsegund/.test(texto)?1:2;escolha=s.opcoes[pos];if(!escolha)return responder('Não encontrei essa opção na última consulta. Qual é o nome do animal que você quer conhecer?');}
    if(!escolha&&/\b(ele|ela|dele|dela|nele|nela)\b/.test(texto)){
        if(s.opcoes.length===1)escolha=s.opcoes[0];
        else return responder('Qual dos animais você quer conhecer? Informe o nome ou diga primeira, segunda ou terceira opção.');
    }
    const nomeExplicito=texto.match(/(?:saber mais sobre|detalhes (?:da|do)|como e|adotar)\s+(?:a |o |um |uma )?([a-z][a-z\s-]{1,70})[?.!]*$/)?.[1]?.trim();
    const generico=/^(cao|cachorro|gata?|animal|filhote|cachorrinha|cachorrinho)(?:\s|$)/;
    if(!escolha&&nomeExplicito&&!generico.test(nomeExplicito))escolha={nome:nomeExplicito};
    if(escolha){
        const r=await executarFerramenta('obter_detalhes_animal',escolha.id?{animal_id:String(escolha.id)}:{nome:escolha.nome},cliente);
        if(!r.sucesso){if(r.animais?.length){s.opcoes=publicos(r.animais);return responder('Há mais de um animal com esse nome. Abra os perfis abaixo para identificar qual você deseja conhecer.',s.opcoes);}return responder('Esse animal não foi encontrado entre os disponíveis agora. A disponibilidade pode mudar; consulte os animais disponíveis para ver as opções atuais.');}
        s.opcoes=publicos([r.animal]);
        return responder(/\b(adotar|adocao|interesse|quero ficar)\b/.test(texto)?`Para manifestar interesse em ${r.animal.nome}, abra o perfil abaixo e selecione Manifestar interesse. A equipe realiza a triagem. O formulário não reserva o animal nem confirma a adoção.`:`Encontrei o perfil de ${r.animal.nome}. Abra o cartão abaixo para consultar as características cadastradas. Informações de saúde e adaptação devem ser confirmadas com a equipe.`,s.opcoes);
    }
    if(/\b(como funciona|processo|requisitos|documentacao|taxa|pagamento)\b/.test(texto)||/^(quero adotar|quero adotar um animal)[.!?]*$/.test(texto))return responder('Conheça os animais na seção Adote, abra um perfil e selecione Manifestar interesse. A equipe avalia o cadastro e orienta os próximos passos. O envio não reserva o animal nem garante aprovação. A conta do adotante permite acompanhar o pedido.');
    if(/\b(cachorr\w*|caes|cao|cadela)\b/.test(texto))s.filtros.especie='cao';
    if(/\b(gat\w*|felin\w*)\b/.test(texto))s.filtros.especie='gato';
    if(/\b(pequen[oa]s?|pequenin[oa])\b/.test(texto))s.filtros.porte='pequeno';
    if(/\b(medi[oa]s?)\b/.test(texto))s.filtros.porte='medio';
    if(/\b(grandes?)\b/.test(texto))s.filtros.porte='grande';
    if(/\b(filhotes?)\b/.test(texto))s.filtros.faixa_etaria='filhote';
    if(/\b(adult[oa]s?)\b/.test(texto))s.filtros.faixa_etaria='adulto';
    if(/\b(idos[oa]s?)\b/.test(texto))s.filtros.faixa_etaria='idoso';
    if(/\b(femeas?|cadela|gata|cachorrinha)\b/.test(texto))s.filtros.sexo='femea';
    if(/\b(machos?)\b/.test(texto))s.filtros.sexo='macho';
    if(/\bcriancas?\b/.test(texto))s.filtros.convivencia_criancas=true;
    if(/\b(outros animais|outro animal)\b/.test(texto))s.filtros.convivencia_outros_animais=true;
    const listar=/\b(ver|mostrar|mostre|opcoes|catalogo|todos|todas|qualquer|indiferente)\b/.test(texto);
    if(!Object.keys(s.filtros).length&&!listar)return responder('Posso consultar os animais disponíveis e explicar o processo de adoção. Você procura um cão ou um gato?');
    if(!s.filtros.especie&&!listar)return responder('Entendi sua preferência. Você procura um cão ou um gato?');
    if(Object.keys(s.filtros).length===1&&!listar)return responder('Você tem preferência por porte pequeno, médio ou grande? Se preferir, posso mostrar as opções disponíveis.');
    const r=await executarFerramenta('buscar_animais',s.filtros,cliente);s.opcoes=publicos(r.animais);
    if(!s.opcoes.length)return responder('Não encontrei animais disponíveis com essas características no cadastro atual. Você prefere mudar o porte ou consultar todos os animais à espera de um lar?');
    return responder(`Encontrei ${s.opcoes.length===1?'esta opção disponível':'estas opções disponíveis'}. Abra o perfil para conhecer melhor cada animal e, se desejar, manifestar interesse. A disponibilidade será conferida no envio do formulário.`,s.opcoes);
}
