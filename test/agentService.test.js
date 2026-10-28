import './setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { executarAgente, agenteIA } from '../src/services/agentService.js';
import { executarFerramenta } from '../src/services/agentTools.js';
import { INSTRUCAO_SISTEMA } from '../src/services/agentInstructions.js';

test('conversa preserva preferências anteriores sem misturar sessões', async () => {
    const original=agenteIA.criarChat;const consultas=[];
    try {
        agenteIA.criarChat=config=>{consultas.push(structuredClone(config.history));return {async sendMessage(){return {text:'Você prefere porte pequeno ou médio?'};}};};
        const id=randomUUID();await executarAgente('Quero uma gata',id);await executarAgente('Pequena',id);await executarAgente('Quero um cão',randomUUID());
        assert.deepEqual(consultas[0],[]);
        assert.equal(consultas[1][0].parts[0].text,'Quero uma gata');
        assert.equal(consultas[1][1].role,'model');
        assert.deepEqual(consultas[2],[]);
    } finally {agenteIA.criarChat=original;}
});

test('resposta após a terceira ferramenta é aproveitada sem fallback indevido',async()=>{
    const original=agenteIA.criarChat;let chamadas=0;
    try {
        agenteIA.criarChat=()=>({async sendMessage(){chamadas++;return chamadas<=3?{functionCalls:[{name:'consultar_requisitos_adocao',args:{},id:String(chamadas)}]}:{text:'Abra o perfil e selecione Manifestar interesse.'};}});
        const r=await executarAgente('Como iniciar a adoção?',randomUUID());
        assert.equal(r.mensagem,'Abra o perfil e selecione Manifestar interesse.');
        assert.equal(r.ferramentas_usadas.length,3);assert.equal(chamadas,4);
    } finally {agenteIA.criarChat=original;}
});

test('excesso de ferramentas não executa consultas sem limite nem afirma encaminhamento',async()=>{
    const original=agenteIA.criarChat;let consultas=0;
    try {
        agenteIA.criarChat=()=>({async sendMessage(){return {functionCalls:Array.from({length:4},()=>({name:'buscar_animais',args:{especie:'gato'}}))};}});
        const r=await executarAgente('Procuro uma gata pequena',randomUUID(),{from(){consultas++;throw new Error('Não consultar');}});
        assert.equal(consultas,0);assert.equal(r.ferramentas_usadas.length,0);
        assert.match(r.mensagem,/Nenhum pedido foi enviado/);assert.doesNotMatch(r.mensagem,/3541|Consegui consultar/);
    } finally {agenteIA.criarChat=original;}
});

test('requisitos apontam para o formulário e contato não inventa telefone',async()=>{
    const regras=await executarFerramenta('consultar_requisitos_adocao');
    assert.match(regras.proximo_passo,/Manifestar interesse/);assert.equal(regras.formulario_enviado,false);
    const contato=await executarFerramenta('encaminhar_para_voluntario',{motivo:'Atendimento'});
    assert.equal(contato.encaminhamento_realizado,false);assert.doesNotMatch(contato.mensagem,/\d{4}-\d{4}/);
    assert.match(INSTRUCAO_SISTEMA,/Não solicite telefone/);
});

test('busca por nome trata porcentagem e sublinhado como texto literal',async()=>{
    const filtros=[];const q={select(){return this;},eq(){return this;},limit(){return this;},ilike(...args){filtros.push(args);return this;},then(resolve){return Promise.resolve({data:[],error:null}).then(resolve);}};
    await executarFerramenta('buscar_animais',{nome:'Mel_%'},{from(){return q;}});
    assert.deepEqual(filtros,[['nome','%Mel\\_\\%%']]);
});

test('ausência de chave de IA retorna indisponibilidade sem chamada externa',async()=>{
    const anterior=process.env.GEMINI_API_KEY;
    try {delete process.env.GEMINI_API_KEY;assert.throws(()=>agenteIA.criarChat({}),e=>e.status===503&&e.code==='ASSISTENTE_INDISPONIVEL');}
    finally {if(anterior!==undefined)process.env.GEMINI_API_KEY=anterior;}
});

test('cartões vêm da consulta e seu contexto mantém a ordem para a próxima mensagem',async()=>{
    const original=agenteIA.criarChat;const histories=[];let turno=0;
    try {
        agenteIA.criarChat=config=>{histories.push(structuredClone(config.history));let envio=0;turno++;return {async sendMessage(){envio++;return turno===1&&envio===1?{functionCalls:[{name:'buscar_animais',args:{especie:'gato'}}]}:{text:'Conheça Mel e Lua.'};}};};
        const animais=[{id:1,nome:'Mel',especie:'gato',situacao:'disponivel',nota_interna:'Não publicar'},{id:2,nome:'Lua',especie:'gato',situacao:'disponivel'},{id:3,nome:'Adotado',situacao:'adotado'}];
        const q={select(){return this;},eq(){return this;},limit(){return this;},then(resolve){return Promise.resolve({data:animais,error:null}).then(resolve);}};
        const id=randomUUID();const r=await executarAgente('Mostre as gatas disponiveis',id,{from(){return q;}});
        assert.deepEqual(r.animais.map(a=>a.nome),['Mel','Lua']);assert.equal(JSON.stringify(r).includes('Não publicar'),false);
        await executarAgente('Quero saber da segunda',id);
        assert.match(histories[1][1].parts[0].text,/Dados consultados/);
        assert.ok(histories[1][1].parts[0].text.indexOf('"nome":"Mel"')<histories[1][1].parts[0].text.indexOf('"nome":"Lua"'));
    } finally {agenteIA.criarChat=original;}
});


test('inicio imediato preserva contexto para o fluxo seguinte', async()=>{
    const original=agenteIA.criarChat;let historico;
    try {
        agenteIA.criarChat=()=>{throw new Error('Inicio nao precisa de chamada externa');};
        const id=randomUUID();const partes=[];
        const inicio=await executarAgente('Procuro um cachorro',id,undefined,{onDelta:t=>partes.push(t)});
        assert.match(inicio.mensagem,/filhote/);assert.equal(partes.length,1);
        agenteIA.criarChat=config=>{historico=structuredClone(config.history);return {async sendMessageStream(){return (async function*(){yield {text:'Vamos conhecer Toby.'};})();}};};
        const resposta=await executarAgente('Filhote',id,undefined,{onDelta:t=>partes.push(t)});
        assert.equal(historico[0].parts[0].text,'Procuro um cachorro');
        assert.equal(resposta.mensagem,'Vamos conhecer Toby.');
    } finally {agenteIA.criarChat=original;}
});


test('escolher especie nao consulta nem mostra animais antes das preferencias', async()=>{
 const original=agenteIA.criarChat;
 try{
  agenteIA.criarChat=()=>({async sendMessage(){return {functionCalls:[{name:'buscar_animais',args:{especie:'cao'}}]};}});
  const resultado=await executarAgente('um cao',randomUUID(),{from(){throw new Error('Nao consultar ainda');}});
  assert.equal(resultado.animais.length,0);assert.match(resultado.mensagem,/filhote/);
  assert.equal(resultado.ferramentas_usadas.length,0);
 }finally{agenteIA.criarChat=original;}
});


test('fluxo pergunta porte antes de consultar filhotes e respeita pedido de ver opcoes',async()=>{
 const original=agenteIA.criarChat;
 try{
  agenteIA.criarChat=()=>({async sendMessageStream(){return (async function*(){yield {functionCalls:[{name:'buscar_animais',args:{especie:'cao',faixa_etaria:'filhote'}}]};})();}});
  const r=await executarAgente('Procuro um cachorro filhote',randomUUID(),{from(){throw new Error('Consulta precoce');}},{onDelta(){}});
  assert.equal(r.animais.length,0);assert.match(r.mensagem,/porte/);
 }finally{agenteIA.criarChat=original;}
});


test('animal em foco persiste entre mensagens, isola sessoes e e limpo em nova busca',async()=>{
 const original=agenteIA.criarChat;const configs=[];let turno=0;
 const animal={id:4,nome:'Nina',especie:'cao',sexo:'femea',porte:'medio',faixa_etaria:'filhote',situacao:'disponivel'};
 const q={select(){return this;},eq(){return this;},limit(){return this;},then(resolve){return Promise.resolve({data:[animal],error:null}).then(resolve);}};
 try{
  agenteIA.criarChat=config=>{configs.push(config);const atual=++turno;let envio=0;return {async sendMessage(){envio++;if(atual===1&&envio===1)return {functionCalls:[{name:'obter_detalhes_animal',args:{animal_id:'4'}}]};if(atual===4&&envio===1)return {functionCalls:[{name:'buscar_animais',args:{especie:'cao'}}]};return {text:'Podemos conversar sobre os cuidados.'};}};};
  const id=randomUUID(),cliente={from(){return q;}};
  await executarAgente('Quero detalhes da Nina',id,cliente);
  await executarAgente('Os cuidados dela',id,cliente);
  assert.match(configs[1].config.systemInstruction,/Animal em foco nesta conversa.*"nome":"Nina"/);
  await executarAgente('Oi',randomUUID(),cliente);
  assert.doesNotMatch(configs[2].config.systemInstruction,/Animal em foco nesta conversa/);
  await executarAgente('Mostre outros animais',id,cliente);
  await executarAgente('Quero conversar',id,cliente);
  assert.doesNotMatch(configs[4].config.systemInstruction,/Animal em foco nesta conversa/);
 }finally{agenteIA.criarChat=original;}
});
