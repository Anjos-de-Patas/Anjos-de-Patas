(() => {
    const chave = 'anjos_adotante_token';
    const estado = document.querySelector('#estado-conta');
    const form = document.querySelector('#form-conta');
    function informar(texto, erro = false) {
        estado.textContent = texto;
        estado.hidden = false;
        estado.classList.toggle('erro', erro);
    }
    async function solicitar(url, opcoes = {}) {
        return window.AnjosAPI.solicitar(url, opcoes);
    }
    if (form) {
        const modo = form.dataset.modo;
        const senha = document.querySelector('#senha-conta');
        document.querySelector('#mostrar-senha-conta').addEventListener('click', evento => {
            const visivel = senha.type === 'password';
            senha.type = visivel ? 'text' : 'password';
            evento.currentTarget.textContent = visivel ? 'Ocultar senha' : 'Mostrar senha';
            evento.currentTarget.setAttribute('aria-pressed', String(visivel));
        });
        form.addEventListener('submit', async evento => {
            evento.preventDefault();
            const botao = form.querySelector('[type=submit]');
            if (botao.disabled || !form.reportValidity()) return;
            const dados = Object.fromEntries(new FormData(form));
            dados.email = dados.email.trim().toLowerCase();
            if (modo === 'cadastro') {
                if (dados.password !== dados.confirmar_password) { informar('As senhas precisam ser iguais.', true); return; }
                delete dados.confirmar_password;
                dados.nome = dados.nome.trim();
                dados.consentimento = document.querySelector('#consentimento-conta').checked;
            }
            botao.disabled = true;
            const texto = botao.textContent;
            botao.textContent = modo === 'cadastro' ? 'Criando conta...' : 'Entrando...';
            informar('Aguarde...');
            try {
                const resposta = await solicitar(`/api/conta-adotante/${modo === 'cadastro' ? 'cadastro' : 'entrar'}`, { method: 'POST', body: JSON.stringify(dados) });
                if (modo === 'cadastro') { form.reset(); informar(resposta.mensagem); }
                else { sessionStorage.setItem(chave, resposta.token); window.location.replace('area-adotante.html'); }
            } catch (erro) { informar(erro.message, true); }
            finally { botao.disabled = false; botao.textContent = texto; }
        });
    }
    if (document.querySelector('#dados-conta')) {
        const token = sessionStorage.getItem(chave);
        if (!token) { window.location.replace('entrar-adotante.html'); return; }
        const sair = document.querySelector('#sair-conta');
        sair.addEventListener('click', () => { sessionStorage.removeItem(chave); window.location.replace('entrar-adotante.html'); });
        async function carregar() {
            informar('Consultando sua conta...');
            document.querySelector('#dados-conta').hidden = true;
            document.querySelector('#atualizar-conta').disabled = true;
            try {
                const resposta = await solicitar('/api/conta-adotante', { headers: { Authorization: `Bearer ${token}` } });
                document.querySelector('#email-conta').textContent = resposta.conta.email;
                document.querySelector('#nome-conta').textContent = resposta.conta.nome || 'Minha conta';
                const pedido = resposta.interesse;
                document.querySelector('#sem-interesse-conta').hidden = !!pedido;
                document.querySelector('#pedido-conta').hidden = !pedido;
                if (pedido) {
                    document.querySelector('#animal-conta').textContent = pedido.animal_nome || 'Interesse em adoção';
                    const nomes = { recebido: 'Interesse recebido', triagem: 'Em triagem', entrevista: 'Entrevista', aprovado: 'Cadastro aprovado', concluida: 'Adoção concluída', encerrado: 'Processo encerrado' };
                    document.querySelector('#situacao-conta').textContent = nomes[pedido.etapa] || 'Consulte a equipe';
                    const orientacao = document.querySelector('#orientacao-conta');
                    orientacao.textContent = pedido.adocao
                        ? `Adoção de ${pedido.adocao.animal_nome} registrada em ${String(pedido.adocao.data_adocao).slice(0,10).split('-').reverse().join('/')}. Entre em contato com a equipe se precisar de orientação.`
                        : pedido.etapa === 'encerrado' ? 'Este processo foi encerrado pela equipe. Entre em contato com a ONG para esclarecer dúvidas.'
                        : 'A aprovação do cadastro não representa adoção concluída ou reserva do animal. Aguarde as orientações da equipe para os próximos passos.';
                    const etapas = document.querySelector('#etapas-conta');
                    etapas.replaceChildren();
                    for (const chaveEtapa of ['recebido','triagem','entrevista','aprovado','concluida']) {
                        const item = document.createElement('li'); item.textContent = nomes[chaveEtapa];
                        const legenda = document.createElement('span');
                        if (pedido.etapa === chaveEtapa) { item.setAttribute('aria-current','step'); legenda.textContent = 'Etapa atual'; }
                        else legenda.textContent = pedido.eventos?.some(e => e.etapa === chaveEtapa) ? 'Registrada no histórico' : 'Sem registro';
                        item.append(legenda); etapas.append(item);
                    }
                    if (pedido.etapa === 'encerrado') {
                        const item=document.createElement('li');item.textContent='Processo encerrado';item.setAttribute('aria-current','step');etapas.append(item);
                    }
                    const historico = document.querySelector('#historico-conta'); historico.replaceChildren();
                    for (const evento of pedido.eventos || []) {
                        const item=document.createElement('li');item.textContent=`${new Date(evento.criado_em).toLocaleString('pt-BR')} · ${nomes[evento.etapa] || 'Atualização de etapa'}`;historico.append(item);
                    }
                }
                document.querySelector('#dados-conta').hidden = false;
                estado.hidden = true;
            } catch (erro) {
                informar(erro.message + ' Se a sessão expirou, saia e entre novamente.', true);
            } finally { document.querySelector('#atualizar-conta').disabled = false; }
        }
        document.querySelector('#atualizar-conta').addEventListener('click', carregar);
        carregar();
    }
})();
