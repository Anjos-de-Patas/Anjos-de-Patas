const api = window.AnjosAPI;
const mensagem = document.querySelector('#mensagem-admin');
const formAdocao = document.querySelector('#form-adocao');
const formAdotante = document.querySelector('#form-adotante');
let animais = [];
let adotantes = [];
let dadosCarregados = false;

function informar(texto) { mensagem.textContent = texto; mensagem.hidden = false; }
function elemento(tag, texto, classe) {
    const el = document.createElement(tag);
    el.textContent = texto;
    if (classe) el.className = classe;
    return el;
}
function preencherSelect(id, registros, textoInicial, rotulo = (registro) => `${registro.nome} (ID ${registro.id})`) {
    const select = document.querySelector(id);
    select.replaceChildren();
    const inicial = elemento('option', textoInicial);
    inicial.value = '';
    select.append(inicial);
    for (const registro of registros) {
        const opcao = elemento('option', rotulo(registro));
        opcao.value = registro.id;
        select.append(opcao);
    }
}
// Marca a opção pelo valor; em uma lista de escolha única as outras são desmarcadas.
function selecionar(select, valor) {
    const opcao = [...select.querySelectorAll('option')].find((item) => item.value === String(valor));
    if (opcao) opcao.selected = true;
    return Boolean(opcao);
}

// Data de hoje no fuso de quem usa a tela, no formato do campo date.
function hoje() {
    const agora = new Date();
    agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
    return agora.toISOString().slice(0, 10);
}

// Aviso abaixo dos campos. Partes em objeto { forte } aparecem em destaque.
function mostrarDica(tipo, partes) {
    const dica = document.querySelector('#dica-adocao');
    dica.dataset.tipo = tipo;
    const texto = elemento('span', '');
    texto.append(...partes.map((parte) => (typeof parte === 'string' ? document.createTextNode(parte) : elemento('strong', parte.forte))));
    dica.replaceChildren(texto);
    dica.hidden = false;
}

// Ao escolher o adotante, seleciona o animal em que ele manifestou interesse.
function preencherPeloAdotante() {
    const campoAnimal = document.querySelector('#animal_id');
    const adotante = adotantes.find((item) => String(item.id) === document.querySelector('#adotante_id').value);
    const interesse = adotante?.interesse;
    document.querySelector('#dica-adocao').hidden = true;
    if (!adotante) return;
    if (!interesse?.animal_id) {
        mostrarDica('info', [{ forte: adotante.nome }, ' não indicou um animal de interesse. Escolha na lista o animal adotado.']);
        return;
    }
    const disponivel = animais.find((animal) => String(animal.id) === String(interesse.animal_id) && animal.situacao === 'disponivel');
    if (disponivel) {
        selecionar(campoAnimal, disponivel.id);
        mostrarDica('info', [{ forte: disponivel.nome }, ` é o animal de interesse de ${adotante.nome} e já foi selecionado. Se a adoção for de outro animal, basta trocar.`]);
    } else {
        selecionar(campoAnimal, '');
        mostrarDica('alerta', [{ forte: interesse.animal_nome || 'O animal de interesse' }, `, escolhido por ${adotante.nome}, não está mais disponível. Escolha na lista o animal adotado.`]);
    }
}

function listarAdotantes() {
    const lista = document.querySelector('#lista-adotantes');
    lista.replaceChildren();
    if (!adotantes.length) lista.append(elemento('p', 'Nenhum interessado cadastrado.'));
    for (const adotante of adotantes) {
        const linha = elemento('article', '', 'linha-registro');
        linha.append(elemento('h3', adotante.nome), elemento('p', `${adotante.email || 'E-mail não informado'} • ${adotante.telefone || 'Telefone não informado'}`));
        const label = elemento('label', `Situação de ${adotante.nome}`);
        const select = document.createElement('select');
        select.id = `status-adotante-${adotante.id}`;
        label.htmlFor = select.id;
        for (const [valor,texto] of [['em triagem','Em triagem'],['aprovado','Aprovado'],['reprovado','Reprovado']]) {
            const opcao = elemento('option', texto);
            opcao.value = valor;
            select.append(opcao);
        }
        select.value = adotante.status;
        const campo = elemento('div', '', 'campo-admin');
        campo.append(label, select);
        const salvar = elemento('button', 'Salvar situação', 'botao-admin secundario');
        salvar.type = 'button';
        salvar.setAttribute('aria-label', `Salvar situação de ${adotante.nome}`);
        salvar.addEventListener('click', async () => {
            salvar.disabled = true;
            try {
                await api.solicitar(`/api/adotantes/${encodeURIComponent(adotante.id)}/status`, { autenticado: true, method: 'PUT', body: JSON.stringify({ status: select.value }) });
                const atualizado = await carregarDados();
                informar(atualizado ? 'Situação do adotante atualizada.' : 'Situação salva. Clique em Atualizar dados para recarregar a lista.');
            } catch (erro) { informar(erro.message); }
            finally { salvar.disabled = false; }
        });
        const acoes = elemento('div', '', 'barra-acoes');
        acoes.append(campo, salvar);
        linha.append(acoes);
        lista.append(linha);
    }
}

async function carregarDados() {
    dadosCarregados = false;
    formAdocao.querySelector('[type=submit]').disabled = true;
    try {
        const resultados = await Promise.allSettled([
            api.solicitar('/api/admin/animais', { autenticado: true }),
            api.solicitar('/api/adotantes', { autenticado: true }),
            api.solicitar('/api/adocoes', { autenticado: true })
        ]);
        const falha = resultados.find((resultado) => resultado.status === 'rejected');
        if (falha) throw falha.reason;
        animais = resultados[0].value.animais || [];
        adotantes = resultados[1].value.adotantes || [];
        preencherSelect('#animal_id', animais.filter((animal) => animal.situacao === 'disponivel'), 'Selecione um animal disponível');
        const selecionado = document.querySelector('#adotante_id').value || new URLSearchParams(window.location.search || '').get('adotante') || '';
        preencherSelect('#adotante_id', adotantes.filter((adotante) => adotante.status === 'aprovado'), 'Selecione um adotante aprovado',
            (adotante) => adotante.interesse?.animal_nome ? `${adotante.nome} (interesse: ${adotante.interesse.animal_nome})` : adotante.nome);
        const campoAdotante = document.querySelector('#adotante_id');
        selecionar(campoAdotante, selecionado);
        preencherPeloAdotante();
        if (!document.querySelector('#data_adocao').value) document.querySelector('#data_adocao').value = hoje();
        listarAdotantes();
        const lista = document.querySelector('#lista-adocoes');
        lista.replaceChildren();
        const adocoes = resultados[2].value.adocoes || [];
        if (!adocoes.length) lista.append(elemento('p', 'Nenhuma adoção registrada.'));
        for (const adocao of adocoes) {
            const animal = animais.find((item) => String(item.id) === String(adocao.animal_id));
            const adotante = adotantes.find((item) => String(item.id) === String(adocao.adotante_id));
            const registro = elemento('article', '', 'linha-registro');
            registro.append(elemento('h3', animal?.nome || `Animal ${adocao.animal_id}`), elemento('p', `Adotante: ${adotante?.nome || adocao.adotante_id}`), elemento('p', `Data: ${adocao.data_adocao}`));
            if (adocao.observacoes) registro.append(elemento('p', adocao.observacoes));
            lista.append(registro);
        }
        dadosCarregados = true;
        formAdocao.querySelector('[type=submit]').disabled = false;
        return true;
    } catch (erro) { informar(erro.message); return false; }
}

document.querySelector('#adotante_id').addEventListener('change', preencherPeloAdotante);

formAdocao.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!dadosCarregados || !formAdocao.reportValidity()) return;
    const botao = formAdocao.querySelector('[type=submit]');
    botao.disabled = true;
    botao.textContent = 'Registrando...';
    try {
        const dados = Object.fromEntries(new FormData(formAdocao));
        await api.solicitar('/api/adocoes', { autenticado: true, method: 'POST', body: JSON.stringify(dados) });
        formAdocao.reset();
        window.history?.replaceState(null, '', window.location.pathname);
        const atualizado = await carregarDados();
        informar(atualizado ? 'Adoção registrada. O animal foi marcado como adotado.' : 'Adoção registrada. Clique em Atualizar dados para recarregar a lista.');
    } catch (erro) { informar(erro.message); }
    finally { botao.disabled = !dadosCarregados; botao.textContent = 'Registrar adoção'; }
});

formAdotante.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!formAdotante.reportValidity()) return;
    const botao = formAdotante.querySelector('[type=submit]');
    botao.disabled = true;
    try {
        const dados = Object.fromEntries(new FormData(formAdotante));
        dados.nome = dados.nome.trim();
        if (dados.nome.length < 3) throw new Error('Informe um nome com pelo menos três letras.');
        await api.solicitar('/api/adotantes', { autenticado: true, method: 'POST', body: JSON.stringify(dados) });
        formAdotante.reset();
        const atualizado = await carregarDados();
        informar(atualizado ? 'Interessado cadastrado e aguardando triagem.' : 'Interessado cadastrado. Clique em Atualizar dados para recarregar a lista.');
    } catch (erro) { informar(erro.message); }
    finally { botao.disabled = false; }
});

document.querySelector('#recarregar-adocoes').addEventListener('click', carregarDados);
carregarDados();
