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
function preencherSelect(id, registros, textoInicial) {
    const select = document.querySelector(id);
    select.replaceChildren();
    const inicial = elemento('option', textoInicial);
    inicial.value = '';
    select.append(inicial);
    for (const registro of registros) {
        const opcao = elemento('option', `${registro.nome} (ID ${registro.id})`);
        opcao.value = registro.id;
        select.append(opcao);
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
        preencherSelect('#adotante_id', adotantes.filter((adotante) => adotante.status === 'aprovado'), 'Selecione um adotante aprovado');
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
        await api.solicitar('/api/adotantes', { method: 'POST', body: JSON.stringify(dados) });
        formAdotante.reset();
        const atualizado = await carregarDados();
        informar(atualizado ? 'Interessado cadastrado e aguardando triagem.' : 'Interessado cadastrado. Clique em Atualizar dados para recarregar a lista.');
    } catch (erro) { informar(erro.message); }
    finally { botao.disabled = false; }
});

document.querySelector('#recarregar-adocoes').addEventListener('click', carregarDados);
carregarDados();
