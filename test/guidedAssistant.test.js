import './setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { executarConsultaGuiada } from '../src/services/guidedAssistant.js';
import { executarAgente } from '../src/services/agentService.js';
function cliente(animais=[]){const filtros=[];const q={select(){return this;},limit(){return this;},eq(...args){filtros.push(args);return this;},ilike(...args){filtros.push(args);return this;},then(resolve){return Promise.resolve({data:animais,error:null}).then(resolve);}};return{filtros,from(){return q;}};}

test('sem chave usa consulta guiada, preserva espécie e filtra porte sem inventar animais',async()=>{
 const anterior=process.env.GEMINI_API_KEY;delete process.env.GEMINI_API_KEY;
 try{const id=randomUUID();const c=cliente();const primeira=await executarAgente('Procuro um cachorro',id,c);assert.equal(primeira.modo,'guiado');assert.match(primeira.mensagem,/porte/);assert.equal(c.filtros.length,0);
 const r=await executarAgente('Pequeno',id,c);assert.equal(r.modo,'guiado');assert.deepEqual(r.animais,[]);assert.match(r.mensagem,/Não encontrei/);assert.ok(c.filtros.some(f=>f[0]==='especie'&&f[1]==='cao'));assert.ok(c.filtros.some(f=>f[0]==='porte'&&f[1]==='pequeno'));}
 finally{if(anterior!==undefined)process.env.GEMINI_API_KEY=anterior;}
});

test('escolha por posição revalida disponibilidade antes de orientar o interesse',async()=>{
 const id=randomUUID(),c=cliente([{id:1,nome:'Mel',situacao:'disponivel',especie:'gato'},{id:2,nome:'Lua',situacao:'disponivel',especie:'gato'}]);
 const r=await executarConsultaGuiada('Mostre os gatos',id,c);assert.equal(r.animais.length,2);
 const vazio=cliente();const detalhe=await executarConsultaGuiada('Quero adotar a segunda',id,vazio);assert.match(detalhe.mensagem,/não foi encontrado/);assert.ok(vazio.filtros.some(f=>f[0]==='id'&&f[1]==='2'));assert.deepEqual(detalhe.animais,[]);
});

test('modo guiado não expõe campos internos, inventa telefone ou confirma adoção',async()=>{
 const c=cliente([{id:1,nome:'Mel',situacao:'disponivel',especie:'gato',nota_interna:'segredo'}]);const id=randomUUID();
 const r=await executarConsultaGuiada('Mostre os gatos',id,c);assert.equal(JSON.stringify(r).includes('segredo'),false);
 const adocao=await executarConsultaGuiada('Quero adotar Mel',id,c);assert.match(adocao.mensagem,/não reserva/);assert.match(adocao.mensagem,/Manifestar interesse/);
 const contato=await executarConsultaGuiada('Qual o telefone?',id,c);assert.match(contato.mensagem,/precisam ser cadastrados/);assert.doesNotMatch(contato.mensagem,/\d{4}-\d{4}/);
});

test('pedido explícito sem filtros remove critérios anteriores e não inverte negação',async()=>{
 const id=randomUUID();await executarConsultaGuiada('Quero um gato pequeno',id,cliente());const c=cliente();await executarConsultaGuiada('Mostre todos os animais sem filtros',id,c);assert.deepEqual(c.filtros,[['situacao','disponivel']]);
 const semConsulta=cliente();const r=await executarConsultaGuiada('Não quero gato',randomUUID(),semConsulta);assert.match(r.mensagem,/deseja/);assert.equal(semConsulta.filtros.length,0);
});

test('referência ambígua é esclarecida e sessões não compartilham preferências',async()=>{
 const id=randomUUID(),c=cliente([{id:1,nome:'Mel',situacao:'disponivel'},{id:2,nome:'Lua',situacao:'disponivel'}]);await executarConsultaGuiada('Mostre os gatos',id,c);
 assert.match((await executarConsultaGuiada('Como é ela?',id,c)).mensagem,/Qual dos animais/);
 assert.match((await executarConsultaGuiada('Pequeno',randomUUID(),cliente())).mensagem,/cão ou um gato/);
});
