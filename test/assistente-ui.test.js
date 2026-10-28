import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';

const aguardar=()=>new Promise(setImmediate);
function ambiente(fetch){
    const {document,window}=parseHTML(fs.readFileSync('index.html','utf8'));
    let focado;
    for(const el of document.querySelectorAll('*'))el.focus=()=>{focado=el.id;};
    vm.runInNewContext(fs.readFileSync('js/assistente.js','utf8'),{document,window:{AnjosAPI:{base:'http://teste.local'}},fetch,AbortController,setTimeout,clearTimeout,URL,TextDecoder});
    return {document,window,get focado(){return focado;},enviar(texto){document.querySelector('#mensagem-chat').value=texto;document.querySelector('#formulario-chat').dispatchEvent(new window.Event('submit',{cancelable:true}));}};
}
const resposta=dados=>({ok:true,json:async()=>({sucesso:true,...dados})});

test('chat apresenta somente cartões disponíveis e links construídos com IDs seguros',async()=>{
    const env=ambiente(async()=>resposta({mensagem:'Encontrei estas opções.',animais:[
        {id:1,nome:'<img src=x onerror=alert(1)>',especie:'gato',porte:'pequeno',situacao:'disponivel'},
        {id:1,nome:'Duplicado',situacao:'disponivel'},
        {id:'javascript:alert(1)',nome:'Link perigoso',situacao:'disponivel'},
        {id:2,nome:'Adotado',situacao:'adotado'},
        {id:3,nome:'Mel',situacao:'disponivel'},
        {id:4,nome:'Lua',situacao:'disponivel'},
        {id:5,nome:'Quarta opção',situacao:'disponivel'}]}));
    env.enviar('Quero um gato');await aguardar();
    const cards=env.document.querySelectorAll('.chat-animal');assert.equal(cards.length,3);
    assert.equal(cards[0].querySelector('h3').textContent,'<img src=x onerror=alert(1)>');assert.equal(cards[0].querySelector('h3 img'),null);
    assert.equal(cards[0].querySelector('a').getAttribute('href'),'pages/animal.html?id=1');
    assert.equal(env.document.querySelector('#mensagens-chat').textContent.includes('Adotado'),false);
});

test('cartão usa miniatura leve, evita URL insegura e trata imagem ausente',async()=>{
 const env=ambiente(async()=>resposta({mensagem:'Conheça estas opções.',animais:[
  {id:1,nome:'Mel',situacao:'disponivel',imagem_url:'https://example.com/original.png',miniatura_url:'https://example.com/pequena.jpg'},
  {id:2,nome:'Lua',situacao:'disponivel',imagem_url:'javascript:alert(1)',miniatura_url:'data:text/html,teste'}]}));
 env.enviar('Procuro uma gata');await aguardar();
 const cards=env.document.querySelectorAll('.chat-animal');const img=cards[0].querySelector('.chat-animal-foto img');assert.equal(img.src,'https://example.com/pequena.jpg');assert.equal(img.width,72);
 img.dispatchEvent(new env.window.Event('error'));assert.equal(img.src,'https://example.com/original.png');img.dispatchEvent(new env.window.Event('error'));assert.ok(cards[0].querySelector('.chat-animal-foto-ausente'));
 assert.equal(cards[1].querySelector('.chat-animal-foto img').getAttribute('src'),'assets/icons/pata-marca.svg');
});

test('falha oferece nova tentativa sem repetir mensagem do usuário',async()=>{
    let falhar=true;const chamadas=[];
    const env=ambiente(async(url,op)=>{chamadas.push(JSON.parse(op.body));if(falhar)throw new Error('offline');return resposta({mensagem:'Vamos continuar.',conversa_id:'conversa-teste'});});
    env.enviar('Procuro uma gata');await aguardar();
    assert.equal(env.document.querySelectorAll('.mensagem-usuario').length,1);
    const repetir=env.document.querySelector('[data-repetir]');assert.ok(repetir);falhar=false;
    repetir.dispatchEvent(new env.window.Event('click',{bubbles:true}));await aguardar();
    assert.equal(chamadas.length,2);assert.equal(chamadas[1].mensagem,'Procuro uma gata');
    assert.equal(env.document.querySelectorAll('.mensagem-usuario').length,1);
    assert.match(env.document.querySelector('#mensagens-chat').textContent,/Vamos continuar/);
    assert.equal(env.document.querySelector('#formulario-chat').getAttribute('aria-busy'),'false');
});

test('nova conversa descarta resposta atrasada e recomeça sem o identificador anterior',async()=>{
    let liberar;const chamadas=[];
    const env=ambiente(async(url,op)=>{chamadas.push(JSON.parse(op.body));if(chamadas.length===1)return new Promise(r=>{liberar=r;});return resposta({mensagem:'Nova busca'});});
    env.enviar('Quero um cachorro');
    env.document.querySelector('#nova-conversa-chat').click();liberar(resposta({mensagem:'Resposta antiga',conversa_id:'antiga'}));await aguardar();
    assert.doesNotMatch(env.document.querySelector('#mensagens-chat').textContent,/Resposta antiga/);
    assert.equal(env.document.querySelector('[data-mensagem]'),null);
    env.enviar('Agora quero um gato');await aguardar();assert.equal(chamadas[1].conversa_id,undefined);
    assert.equal(env.document.querySelectorAll('.mensagem-usuario').length,1);
});

test('Enter envia uma única vez, composição e Shift preservam nova linha e Escape devolve foco',async()=>{
    let chamadas=0;const env=ambiente(async()=>{chamadas++;return resposta({mensagem:'Olá!'});});
    env.document.querySelector('#botao-chat-flutuante').click();assert.equal(env.document.querySelector('#janela-chat').hidden,false);
    const campo=env.document.querySelector('#mensagem-chat');campo.value='Quero adotar';
    const tecla=props=>{const e=new env.window.Event('keydown',{cancelable:true,bubbles:true});Object.assign(e,{key:'Enter',...props});campo.dispatchEvent(e);};
    tecla({shiftKey:true});tecla({isComposing:true});assert.equal(chamadas,0);
    tecla({});await aguardar();assert.equal(chamadas,1);
    const escape=new env.window.Event('keydown',{cancelable:true});escape.key='Escape';env.document.dispatchEvent(escape);
    assert.equal(env.document.querySelector('#janela-chat').hidden,true);assert.equal(env.focado,'botao-chat-flutuante');
});

test('erros consecutivos não acumulam avisos e a consulta guiada é identificada',async()=>{
 let falhar=true;const env=ambiente(async()=>{if(falhar)throw new Error('offline');return resposta({mensagem:'Você prefere qual porte?',modo:'guiado'});});
 env.enviar('Procuro um cachorro');await aguardar();env.document.querySelector('[data-repetir]').dispatchEvent(new env.window.Event('click',{bubbles:true}));await aguardar();
 assert.equal(env.document.querySelectorAll('.chat-erro').length,1);
 falhar=false;env.document.querySelector('[data-repetir]').dispatchEvent(new env.window.Event('click',{bubbles:true}));await aguardar();
 assert.equal(env.document.querySelectorAll('.chat-erro').length,0);assert.match(env.document.querySelector('#aviso-chat').textContent,/sem IA/);
});


test('texto chega antes de terminar o fluxo e cartões aparecem ao concluir',async()=>{
    let fluxo;
    const encoder=new TextEncoder();
    const corpo=new ReadableStream({start(controller){fluxo=controller;}});
    const env=ambiente(async()=>({ok:true,headers:{get:()=> 'text/event-stream'},body:corpo}));
    env.enviar('Procuro um cachorro filhote');await aguardar();
    fluxo.enqueue(encoder.encode('event: delta\ndata: {"texto":"Toby está aqui."}\n\n'));
    await aguardar();
    assert.match(env.document.querySelector('#mensagens-chat').textContent,/Toby está aqui/);
    assert.equal(env.document.querySelector('#formulario-chat').getAttribute('aria-busy'),'true');
    fluxo.enqueue(encoder.encode('event: done\ndata: {"sucesso":true,"mensagem":"Toby está aqui. Quer conhecer Toby?","animais":[]}\n\n'));
    fluxo.close();await aguardar();await aguardar();
    assert.equal(env.document.querySelector('#formulario-chat').getAttribute('aria-busy'),'false');
    assert.match(env.document.querySelector('#mensagens-chat').textContent,/Quer conhecer Toby/);
});


test('conversa usa apenas digitacao e preserva perfis dos animais',async()=>{
 const env=ambiente(async()=>resposta({mensagem:'Qual porte voce prefere?',animais:[{id:3,nome:'Toby',situacao:'disponivel'}]}));
 env.enviar('Filhote');await aguardar();
 assert.equal(env.document.querySelectorAll('[data-mensagem],.chat-respostas,.chat-conhecer').length,0);
 assert.ok(env.document.querySelector('.chat-animal a'));
 assert.equal(env.document.querySelector('#mensagem-chat').disabled,false);
});
