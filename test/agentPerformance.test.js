import './setup.js';import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {agenteIA,executarAgente} from '../src/services/agentService.js';
import {miniaturaPublica} from '../src/services/animalImages.js';
import {respostaConsulta} from '../src/services/agentReplies.js';

test('busca simples usa uma única geração e retorna miniatura sem reduzir a verificação do banco',async()=>{
 const original=agenteIA.criarChat;let geracoes=0,consultas=0;
 try{
  agenteIA.criarChat=config=>{assert.equal(config.config.thinkingConfig.thinkingLevel,'MINIMAL');return {async sendMessage(){geracoes++;return {functionCalls:[{name:'buscar_animais',args:{especie:'cao',faixa_etaria:'filhote'}}]};}};};
  const animal={id:3,nome:'Toby',especie:'cao',faixa_etaria:'filhote',situacao:'disponivel',imagem_url:'https://nadggghbymqvvueiihab.supabase.co/storage/v1/object/public/animais-imagens/testes-assistente/20261028/3-toby.png'};
  const q={select(){return this;},eq(){return this;},limit(){return this;},then(resolve){consultas++;return Promise.resolve({data:[animal],error:null}).then(resolve);}};
  const r=await executarAgente('Procuro um cachorro filhote',randomUUID(),{from(){return q;}});
  assert.equal(geracoes,1);assert.equal(consultas,1);assert.match(r.mensagem,/uma opção/);assert.match(r.animais[0].miniatura_url,/miniaturas\/3-toby.jpg$/);
 }finally{agenteIA.criarChat=original;}
});

test('questões comparativas continuam no modelo e não mandam URLs de imagem ao Gemini',async()=>{
 const original=agenteIA.criarChat;let geracoes=0,retorno;
 try{
  agenteIA.criarChat=()=>({async sendMessage(op){geracoes++;if(geracoes===1)return {functionCalls:[{name:'buscar_animais',args:{especie:'gato'}}]};retorno=op.message;return{text:'Vamos comparar as características cadastradas.'};}});
  const q={select(){return this;},eq(){return this;},limit(){return this;},then(resolve){return Promise.resolve({data:[{id:1,nome:'Mel',situacao:'disponivel',imagem_url:'https://example.com/imagem.png'}],error:null}).then(resolve);}};
  await executarAgente('Compare os gatos para minha rotina',randomUUID(),{from(){return q;}});assert.equal(geracoes,2);assert.equal(JSON.stringify(retorno).includes('example.com'),false);
 }finally{agenteIA.criarChat=original;}
});

test('ausência de resultado propõe alternativa concreta sem alterar filtros nem prometer disponibilidade',()=>{
 const filtros={especie:'cao',faixa_etaria:'filhote'};const r=respostaConsulta('buscar_animais',{sucesso:true,animais:[]},filtros,'Procuro um filhote');
 assert.match(r,/no cadastro agora/);assert.match(r,/adultos/);assert.deepEqual(filtros,{especie:'cao',faixa_etaria:'filhote'});
 assert.equal(miniaturaPublica('javascript:alert(1)'),undefined);assert.equal(miniaturaPublica('https://example.com/foto.jpg'),'https://example.com/foto.jpg');
});
