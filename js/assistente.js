(() => {
    const janela=document.querySelector('#janela-chat');
    if(!janela)return;
    const flutuante=document.querySelector('#botao-chat-flutuante');
    const aberturas=[flutuante,...document.querySelectorAll('[data-abrir-chat]')];
    const fechar=document.querySelector('#fechar-chat');
    const nova=document.querySelector('#nova-conversa-chat');
    const area=document.querySelector('#mensagens-chat');
    const form=document.querySelector('#formulario-chat');
    const campo=document.querySelector('#mensagem-chat');
    const enviar=form.querySelector('[type="submit"]');
    const estado=document.querySelector('#estado-chat');
    const inicio=[...area.children].map(el=>el.cloneNode(true));
    let origem=null,conversaId=null,emEnvio=false,controlador=null,versao=0;
    const rotulos={cao:'Cão',gato:'Gato',pequeno:'Porte pequeno',medio:'Porte médio',grande:'Porte grande',filhote:'Filhote',adulto:'Adulto',idoso:'Idoso'};
    const elemento=(tag,texto,classe)=>{const el=document.createElement(tag);if(texto!==undefined)el.textContent=texto;if(classe)el.className=classe;return el;};
    const rolar=()=>{area.scrollTop=area.scrollHeight;};
    const imagemSegura=valor=>{try{const u=new URL(valor);return ['https:','http:'].includes(u.protocol)?u.href:null;}catch{return null;}};
    function aberto(valor,botao){
        if(valor){origem=botao||document.activeElement;janela.hidden=false;janela.classList.add('chat-visivel');campo.focus();}
        else{janela.hidden=true;janela.classList.remove('chat-visivel');origem?.focus();}
        janela.setAttribute('aria-hidden',String(!valor));
        aberturas.forEach(el=>el?.setAttribute('aria-expanded',String(valor)));
    }
    aberturas.forEach(el=>el?.addEventListener('click',()=>aberto(janela.hidden,el)));
    fechar.addEventListener('click',()=>aberto(false));
    document.querySelector('#chat-ver-catalogo')?.addEventListener('click',()=>aberto(false));
    document.addEventListener('keydown',evento=>{if(evento.key==='Escape'&&!janela.hidden){evento.preventDefault();aberto(false);}});
    function ajustarAltura(){if(window.visualViewport)janela.style.setProperty('--chat-viewport',`${window.visualViewport.height}px`);}
    window.visualViewport?.addEventListener('resize',ajustarAltura);ajustarAltura();
    function ocupado(valor){
        emEnvio=valor;form.setAttribute('aria-busy',String(valor));enviar.disabled=valor;campo.disabled=valor;
        enviar.querySelector('span').textContent=valor?'Enviando':'Enviar';
        area.querySelectorAll('[data-repetir]').forEach(b=>{b.disabled=valor;});
    }
    function mensagem(texto,tipo){const el=elemento('div',undefined,`mensagem ${tipo}`);el.append(elemento('p',texto));area.append(el);rolar();return el;}
    function cartoes(animais,parent){
        const ids=new Set();const lista=elemento('div',undefined,'chat-animais');
        for(const animal of Array.isArray(animais)?animais:[]){
            const id=String(animal.id??'');
            if(animal.situacao!=='disponivel'||!/^([1-9]\d{0,19}|[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12})$/i.test(id)||ids.has(id)||typeof animal.nome!=='string')continue;
            ids.add(id);const card=elemento('article',undefined,'chat-animal');
            const foto=elemento('div',undefined,'chat-animal-foto');
            const original=imagemSegura(animal.imagem_url),miniatura=imagemSegura(animal.miniatura_url)||original;
            const semFoto=()=>{foto.replaceChildren();const icone=elemento('img');icone.src='assets/icons/pata-marca.svg';icone.alt='';icone.width=30;icone.height=30;foto.append(icone);foto.classList.add('chat-animal-foto-ausente');};
            if(miniatura){const img=elemento('img');img.src=miniatura;img.alt=`Imagem de ${animal.nome}`;img.width=72;img.height=72;img.loading='lazy';img.decoding='async';let tentouOriginal=false;img.addEventListener('error',()=>{if(original&&img.src!==original&&!tentouOriginal){tentouOriginal=true;img.src=original;}else semFoto();});foto.append(img);}else semFoto();
            const conteudo=elemento('div',undefined,'chat-animal-conteudo');conteudo.append(elemento('h3',animal.nome));card.append(foto,conteudo);
            const ficha=[animal.especie,animal.porte,animal.faixa_etaria].map(v=>rotulos[v]).filter(Boolean).join(' · ');
            if(ficha)conteudo.append(elemento('p',ficha,'chat-animal-ficha'));
            const link=elemento('a','Conhecer melhor →');link.href=`pages/animal.html?id=${encodeURIComponent(id)}`;link.setAttribute('aria-label',`Conhecer ${animal.nome} e manifestar interesse`);conteudo.append(link);lista.append(card);
            if(ids.size===3)break;
        }
        if(ids.size){parent.append(lista);rolar();}
    }
    async function consultar(texto,sinal,aoReceber){
        const response=await fetch(`${window.AnjosAPI.base}/api/agente`,{method:'POST',headers:{'Content-Type':'application/json','Accept':'text/event-stream'},signal:sinal,body:JSON.stringify({mensagem:texto,...(conversaId?{conversa_id:conversaId}:{})})});
        let dados;
        if(response.ok&&response.headers?.get('content-type')?.includes('text/event-stream')){
            const leitor=response.body.getReader(),decoder=new TextDecoder();let buffer='';
            function processar(bloco){
                const linhas=bloco.split('\n');
                const evento=linhas.find(l=>l.startsWith('event:'))?.slice(6).trim();
                const bruto=linhas.filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n');
                if(!bruto)return;
                const valor=JSON.parse(bruto);
                if(evento==='delta'&&typeof valor.texto==='string')aoReceber(valor.texto);
                if(evento==='done')dados=valor;
                if(evento==='error')throw new Error('Consulta interrompida');
            }
            try{
                while(true){const {value,done}=await leitor.read();buffer+=decoder.decode(value,{stream:!done}).replace(/\r/g,'');let fim;while((fim=buffer.indexOf('\n\n'))>=0){processar(buffer.slice(0,fim));buffer=buffer.slice(fim+2);}if(done)break;}
                if(!dados)throw new Error('Resposta incompleta');
            }finally{leitor.releaseLock();}
        }else dados=await response.json();
        if(!response.ok||!dados.sucesso||typeof dados.mensagem!=='string'||!dados.mensagem.trim()){
            const erro=new Error('Consulta indisponível');erro.status=response.status;throw erro;
        }
        return dados;
    }
    async function enviarMensagem(texto,repetir=false){
        texto=texto.trim();if(emEnvio||texto.length>1000)return;
        if(texto.length<2){estado.textContent='Escreva pelo menos dois caracteres.';campo.focus();return;}
        const atual=++versao;
        area.querySelectorAll('.chat-erro').forEach(b=>b.remove());
        if(!repetir)mensagem(texto,'mensagem-usuario');
        campo.value='';ocupado(true);estado.textContent='Consultando as informações.';
        const carregando=mensagem('Consultando as informações…','mensagem-assistente chat-carregando');
        controlador=new AbortController();const pedido=controlador;
        const timer=setTimeout(()=>pedido.abort(),30000);
        let parcial=null,textoParcial='';
        try{
            const resposta=await consultar(texto,pedido.signal,trecho=>{
                if(atual!==versao)return;
                carregando.remove();
                parcial ||= mensagem('', 'mensagem-assistente');
                textoParcial+=trecho;parcial.querySelector('p').textContent=textoParcial;rolar();
            });if(atual!==versao)return;
            carregando.remove();if(typeof resposta.conversa_id==='string')conversaId=resposta.conversa_id;
            document.querySelector('#aviso-chat').textContent=resposta.modo==='guiado'
                ?'Consulta guiada aos animais disponíveis, sem IA. O interesse é registrado no formulário e avaliado pela equipe.'
                :'Respostas com apoio de IA. O interesse é registrado no formulário; a adoção é avaliada pela equipe.';
            const el=parcial||mensagem('', 'mensagem-assistente');el.querySelector('p').textContent=resposta.mensagem;cartoes(resposta.animais,el);
            estado.textContent='Resposta recebida.';
        }catch(falha){
            if(atual!==versao)return;carregando.remove();parcial?.remove();
            const textoErro=falha.status===429?'Você fez várias consultas em sequência. Aguarde alguns minutos ou continue pela seção Adote.':falha.name==='AbortError'?'A consulta demorou mais que o esperado. Tente novamente ou continue pela seção Adote.':'Não consegui conectar ao atendimento agora. Tente novamente ou continue pela seção Adote.';
            const erro=mensagem(textoErro,'mensagem-assistente chat-erro');
            const repetirBotao=elemento('button','Tentar novamente','chat-repetir');repetirBotao.type='button';repetirBotao.dataset.repetir=texto;erro.append(repetirBotao);
            const catalogo=elemento('a','Ver animais disponíveis');catalogo.href='#adote';catalogo.addEventListener('click',()=>aberto(false));erro.append(catalogo);
            estado.textContent='Consulta indisponível. Você pode tentar novamente.';rolar();
        }finally{clearTimeout(timer);if(atual===versao){controlador=null;ocupado(false);if(!janela.hidden)campo.focus();}}
    }
    form.addEventListener('submit',evento=>{evento.preventDefault();enviarMensagem(campo.value);});
    campo.addEventListener('keydown',evento=>{if(evento.key==='Enter'&&!evento.shiftKey&&!evento.isComposing){evento.preventDefault();enviarMensagem(campo.value);}});
    area.addEventListener('click',evento=>{
        const repetir=evento.target.closest('[data-repetir]');if(repetir){enviarMensagem(repetir.dataset.repetir,true);return;}
    });
    nova.addEventListener('click',()=>{
        versao++;controlador?.abort();controlador=null;conversaId=null;
        area.replaceChildren(...inicio.map(el=>el.cloneNode(true)));campo.value='';ocupado(false);
        document.querySelector('#aviso-chat').textContent='O chat ajuda a consultar animais e entender a adoção. O interesse é registrado no formulário.';
        estado.textContent='Nova conversa iniciada.';campo.focus();rolar();
    });
})();
