const api = window.AnjosAPI;
const form = document.querySelector('#form-resgate');
const selecionarAnimal = document.querySelector('#animal-resgate');
const botaoSalvar = document.querySelector('#salvar-resgate');
const mensagem = document.querySelector('#mensagem-admin');
const lista = document.querySelector('#lista-resgates');
const busca = document.querySelector('#busca-resgate');
let animais = [];
let resgates = [];
let carregado = false;
const agora = new Date();
const hoje = `${agora.getFullYear()}-${String(agora.getMonth()+1).padStart(2,'0')}-${String(agora.getDate()).padStart(2,'0')}`;
document.querySelector('#data-resgate').max = hoje;
document.querySelector('#data-resgate').value = hoje;
function informar(texto) { mensagem.textContent = texto; mensagem.hidden = false; }
function elemento(tag, texto, classe) {
    const el = document.createElement(tag);
    el.textContent = texto;
    if (classe) el.className = classe;
    return el;
}
function mostrarResgates() {
    const termo = busca.value.trim().toLocaleLowerCase('pt-BR');
    const nomes = new Map(animais.map(a => [String(a.id), a.nome]));
    const filtrados = resgates.filter(r => [nomes.get(String(r.animal_id)),r.local_resgate,r.motivo].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR').includes(termo));
    lista.replaceChildren();
    document.querySelector('#resumo-resgates').textContent = `${filtrados.length} de ${resgates.length} registros`;
    if (!filtrados.length) lista.append(elemento('p', termo ? 'Nenhum resgate encontrado com essa pesquisa.' : 'Nenhum resgate registrado.'));
    for (const resgate of filtrados) {
        const artigo = elemento('article', '', 'linha-registro');
        const nome = nomes.get(String(resgate.animal_id)) || `Animal ID ${resgate.animal_id}`;
        artigo.append(elemento('h3', nome));
        const data = /^\d{4}-\d{2}-\d{2}$/.test(resgate.data_resgate || '') ? resgate.data_resgate.split('-').reverse().join('/') : 'Não informada';
        artigo.append(elemento('p', `Data: ${data}`), elemento('p', `Local: ${resgate.local_resgate || 'Não informado'}`), elemento('p', `Motivo: ${resgate.motivo || 'Não informado'}`));
        if (resgate.observacoes) artigo.append(elemento('p', `Observações: ${resgate.observacoes}`));
        lista.append(artigo);
    }
}
async function carregarResgates() {
    carregado = false;
    botaoSalvar.disabled = true;
    selecionarAnimal.disabled = true;
    lista.setAttribute('aria-busy','true');
    lista.replaceChildren(elemento('p','Carregando resgates...'));
    document.querySelector('#resumo-resgates').textContent = '';
    try {
        const respostas = await Promise.allSettled([
            api.solicitar('/api/admin/animais', { autenticado: true }),
            api.solicitar('/api/resgates', { autenticado: true })
        ]);
        const falha = respostas.find(r => r.status === 'rejected');
        if (falha) throw falha.reason;
        const selecionado = selecionarAnimal.value;
        animais = respostas[0].value.animais || [];
        resgates = respostas[1].value.resgates || [];
        selecionarAnimal.replaceChildren();
        const inicial = elemento('option','Selecione o animal');inicial.value='';selecionarAnimal.append(inicial);
        for (const animal of animais) {
            const opcao = elemento('option',`${animal.nome} (ID ${animal.id})`);
            opcao.value = animal.id;
            selecionarAnimal.append(opcao);
        }
        if (animais.some(a => String(a.id) === selecionado)) selecionarAnimal.value = selecionado;
        carregado = true;
        selecionarAnimal.disabled = !animais.length;
        botaoSalvar.disabled = !animais.length;
        document.querySelector('#aviso-sem-animais').hidden = animais.length > 0;
        mostrarResgates();
        return true;
    } catch (erro) {
        lista.replaceChildren(elemento('p','Não foi possível consultar os registros. Clique em Atualizar dados para tentar novamente.'));
        informar(erro.message);
        return false;
    } finally { lista.setAttribute('aria-busy','false'); }
}
form.addEventListener('submit', async evento => {
    evento.preventDefault();
    if (!carregado || botaoSalvar.disabled || !form.reportValidity()) return;
    const dados = Object.fromEntries(new FormData(form));
    const animalId = dados.animal_id;
    delete dados.animal_id;
    for (const key of Object.keys(dados)) dados[key] = dados[key].trim();
    if (!animais.some(a => String(a.id) === animalId)) { informar('Selecione um animal cadastrado.'); return; }
    if (!dados.data_resgate || dados.data_resgate > hoje) { informar('A data do resgate não pode estar no futuro.'); return; }
    if (dados.local_resgate.length < 2 || dados.motivo.length < 2) { informar('Preencha o local e o motivo com pelo menos dois caracteres.'); return; }
    botaoSalvar.disabled = true;
    botaoSalvar.textContent = 'Registrando...';
    selecionarAnimal.disabled = true;
    try {
        await api.solicitar(`/api/animais/${encodeURIComponent(animalId)}/resgates`, { autenticado:true, method:'POST', body:JSON.stringify(dados) });
        form.reset();
        document.querySelector('#data-resgate').value = hoje;
        const atualizado = await carregarResgates();
        informar(atualizado ? 'Resgate registrado e incluído no histórico do animal.' : 'Resgate registrado. Clique em Atualizar dados para consultar a lista.');
    } catch (erro) { informar(erro.message); }
    finally {
        botaoSalvar.disabled = !carregado || !animais.length;
        selecionarAnimal.disabled = !carregado || !animais.length;
        botaoSalvar.textContent = 'Registrar resgate';
    }
});
busca.addEventListener('input', () => { if (carregado) mostrarResgates(); });
document.querySelector('#atualizar-resgates').addEventListener('click', carregarResgates);
carregarResgates();
