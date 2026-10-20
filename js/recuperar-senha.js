(() => {
    const solicitar=document.querySelector('#form-recuperar');
    const redefinir=document.querySelector('#form-redefinir');
    const estado=document.querySelector('#estado-conta');
    function informar(texto,erro=false){estado.textContent=texto;estado.hidden=false;estado.classList.toggle('erro',erro);}
    let ocupado=false;
    function bloquear(valor){ocupado=valor;for(const botao of document.querySelectorAll('form button'))botao.disabled=valor;}
    solicitar.addEventListener('submit',async evento=>{
        evento.preventDefault();if(ocupado||!solicitar.reportValidity())return;
        bloquear(true);
        try{
            const email=document.querySelector('#email-recuperar').value.trim().toLowerCase();
            const dados=await window.AnjosAPI.solicitar('/api/recuperar-senha',{method:'POST',body:JSON.stringify({email})});
            informar(dados.mensagem);solicitar.hidden=true;redefinir.hidden=false;document.querySelector('#email-redefinir').value=email;document.querySelector('#codigo-redefinir').focus();
        }catch(erro){informar(erro.message,true);}finally{bloquear(false);}
    });
    redefinir.addEventListener('submit',async evento=>{
        evento.preventDefault();if(ocupado||!redefinir.reportValidity())return;
        const password=document.querySelector('#senha-redefinir').value;
        if(password!==document.querySelector('#confirmar-redefinir').value){informar('As senhas precisam ser iguais.',true);return;}
        bloquear(true);
        try{
            const dados=await window.AnjosAPI.solicitar('/api/redefinir-senha',{method:'POST',body:JSON.stringify({email:document.querySelector('#email-redefinir').value.trim().toLowerCase(),codigo:document.querySelector('#codigo-redefinir').value.trim(),password})});
            sessionStorage.removeItem('anjos_token');sessionStorage.removeItem('anjos_usuario');sessionStorage.removeItem('anjos_adotante_token');
            redefinir.reset();redefinir.hidden=true;informar(dados.mensagem);
        }catch(erro){informar(erro.message,true);}finally{bloquear(false);}
    });
    document.querySelector('#novo-codigo').addEventListener('click',()=>{if(ocupado)return;redefinir.reset();redefinir.hidden=true;solicitar.hidden=false;estado.hidden=true;document.querySelector('#email-recuperar').focus();});
})();
