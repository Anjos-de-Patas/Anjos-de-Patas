(() => {
    const api = window.AnjosAPI;
    const lista = document.querySelector('#lista-interessados');
    const mensagem = document.querySelector('#mensagem-admin');
    const anterior = document.querySelector('#anterior-interessados');
    const proximo = document.querySelector('#proximo-interessados');
    const atualizar = document.querySelector('#atualizar-interessados');
    const filtro = document.querySelector('#filtros-interessados');
    const etapas = { recebido: 'Interesse recebido', triagem: 'Em triagem', entrevista: 'Entrevista', aprovado: 'Cadastro aprovado', concluida: 'Adoção concluída', encerrado: 'Processo encerrado' };
    let pagina = 1, carregando = false, total = 0, busca = '', etapaFiltro = '';
    const el = (tag, texto, classe) => { const e = document.createElement(tag); e.textContent = texto; if (classe) e.className = classe; return e; };
    const informar = texto => { mensagem.textContent = texto; mensagem.hidden = false; };
    const data = valor => new Date(valor).toLocaleString('pt-BR');
    function botoes() { anterior.disabled = carregando || pagina === 1; proximo.disabled = carregando || pagina * 20 >= total; atualizar.disabled = carregando; filtro.querySelector('[type=submit]').disabled = carregando; }
    async function carregar() {
        if (carregando) return;
        carregando = true; botoes(); lista.setAttribute('aria-busy', 'true'); lista.replaceChildren();
        try {
            const query = new URLSearchParams({ pagina, busca, etapa: etapaFiltro });
            const dados = await api.solicitar(`/api/admin/interessados?${query}`, { autenticado: true });
            total = dados.total || 0;
            document.querySelector('#resumo-interessados').textContent = `${total} cadastro(s) · Página ${pagina} de ${Math.max(1, Math.ceil(total / 20))}`;
            if (!dados.interessados.length) lista.append(el('p', 'Nenhum interessado encontrado.'));
            for (const pessoa of dados.interessados) renderizar(pessoa);
        } catch (erro) { informar(erro.message); document.querySelector('#resumo-interessados').textContent = 'Consulta indisponível. Use Atualizar dados para tentar novamente.'; total = 0; }
        finally { carregando = false; botoes(); lista.setAttribute('aria-busy','false'); }
    }
    function renderizar(pessoa) {
        const card = el('article', '', 'linha-registro interessado-card');
        card.append(el('h3', pessoa.nome), el('p', `${pessoa.email} · ${window.AnjosTelefone.formatar(pessoa.telefone || '')}`), el('p', `Etapa: ${etapas[pessoa.etapa] || 'Interesse recebido'} · Recebido em ${data(pessoa.criado_em)}`));
        if (pessoa.interesse) {
            card.append(el('p', `Animal: ${pessoa.interesse.animal_nome || 'Não informado'} · Cidade: ${pessoa.interesse.cidade || 'Não informada'}`));
            if (pessoa.interesse.mensagem) card.append(el('p', pessoa.interesse.mensagem));
        }
        const detalhes = el('details','');
        detalhes.append(el('summary', `Gerenciar ${pessoa.nome}`));
        const form = el('form','', 'form-admin');
        const select = document.createElement('select'); select.id = `etapa-${pessoa.id}`; select.name = 'etapa';
        for (const [valor, texto] of Object.entries(etapas)) { const opcao = el('option',texto); opcao.value=valor; if (valor==='concluida' && pessoa.etapa!=='concluida') opcao.disabled=true; select.append(opcao); }
        select.value = pessoa.etapa || 'recebido';
        if (pessoa.etapa==='concluida') select.disabled = true;
        function campo(label, controle, amplo=false) { const div=el('div','','campo-admin'+(amplo?' campo-amplo':'')); const rotulo=el('label',label); rotulo.htmlFor=controle.id; div.append(rotulo,controle); form.append(div); }
        campo('Etapa do processo',select);
        const tipo = document.createElement('select'); tipo.id=`tipo-${pessoa.id}`;
        for (const [valor,texto] of [['nota','Nota interna'],['contato','Registro de contato']]) { const opcao=el('option',texto); opcao.value=valor; tipo.append(opcao); }
        campo('Tipo de anotação',tipo);
        const nota=document.createElement('textarea'); nota.id=`nota-${pessoa.id}`; nota.maxLength=3000; nota.rows=3;
        campo('Anotação interna (opcional ao mudar etapa)',nota,true);
        form.append(el('p','As anotações ficam restritas à equipe.','nota-admin campo-amplo'));
        const salvar=el('button','Salvar acompanhamento','botao-admin'); salvar.type='submit';
        const historico=el('button','Consultar histórico','botao-admin secundario'); historico.type='button';
        const acoes=el('div','','barra-acoes'); acoes.append(salvar,historico); form.append(acoes);
        const eventos=el('div','','campo-amplo'); eventos.setAttribute('aria-live','polite');
        let versao = pessoa.versao;
        let precisaAtualizar = false;
        historico.addEventListener('click',async()=>{
            historico.disabled=true; eventos.textContent='Consultando histórico...';
            try {
                const dados=await api.solicitar(`/api/admin/interessados/${encodeURIComponent(pessoa.id)}/historico`,{autenticado:true});
                eventos.replaceChildren();
                const ol=el('ol','','historico-etapas');
                for (const evento of dados.eventos) ol.append(el('li',`${data(evento.criado_em)} · ${evento.tipo==='etapa' ? etapas[evento.etapa] || evento.etapa : evento.tipo==='contato' ? 'Contato' : 'Nota interna'}${evento.nota ? ': '+evento.nota : ''}`));
                eventos.append(el('p','Até 100 registros recentes.','nota-admin'),ol);
            } catch(erro) { eventos.textContent=erro.message; }
            finally { historico.disabled=false; }
        });
        form.addEventListener('submit',async evento=>{
            evento.preventDefault();
            if (salvar.disabled || precisaAtualizar || !form.reportValidity()) return;
            if (select.value===pessoa.etapa && !nota.value.trim()) { informar('Mude a etapa ou escreva uma anotação.'); return; }
            salvar.disabled=true;
            try {
                await api.solicitar(`/api/admin/interessados/${encodeURIComponent(pessoa.id)}/acompanhamento`, { autenticado:true,method:'POST',body:JSON.stringify({ etapa:select.value,tipo:tipo.value,nota:nota.value.trim(),versao }) });
                informar('Acompanhamento salvo.');
                await carregar();
            } catch(erro) {
                informar(erro.message);
                if (erro.message.includes('Outro usuário')) { precisaAtualizar=true; salvar.textContent='Atualize os dados antes de salvar'; }
            } finally { salvar.disabled=precisaAtualizar; }
        });
        detalhes.append(form,eventos); card.append(detalhes); lista.append(card);
    }
    filtro.addEventListener('submit',evento=>{ evento.preventDefault(); if(carregando)return; busca=document.querySelector('#busca-interessados').value.trim(); etapaFiltro=document.querySelector('#etapa-filtro').value; pagina=1; carregar(); });
    anterior.addEventListener('click',()=>{if(pagina>1&&!carregando){pagina--;carregar();}});
    proximo.addEventListener('click',()=>{if(pagina*20<total&&!carregando){pagina++;carregar();}});
    atualizar.addEventListener('click',carregar);
    carregar();
})();
