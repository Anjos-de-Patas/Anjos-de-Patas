const api = window.AnjosAPI;
const lista = document.querySelector('#lista-admin');
const mensagem = document.querySelector('#mensagem-admin');
const cadastro = document.querySelector('#cadastro');
const formulario = document.querySelector('#form-animal');
const campoImagem = document.querySelector('#imagem_url');
const previaImagem = document.querySelector('#previa-imagem');
const campoArquivo = document.querySelector('#imagem_arquivo');
let arquivoImagem = null;
let urlPrevia = null;

function limparArquivoImagem(limparCampo = true) {
    arquivoImagem = null;
    if (limparCampo) campoArquivo.value = '';
    if (urlPrevia) URL.revokeObjectURL(urlPrevia);
    urlPrevia = null;
}

campoArquivo.addEventListener('change', () => {
    const arquivo = campoArquivo.files?.[0];
    limparArquivoImagem(false);
    if (!arquivo) { atualizarPreviaImagem(); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type) || arquivo.size > 5 * 1024 * 1024 || !arquivo.size) {
        campoArquivo.value = '';
        informar('Selecione uma foto em JPG, PNG ou WebP de até 5 MB.');
        atualizarPreviaImagem();
        return;
    }
    arquivoImagem = arquivo;
    urlPrevia = URL.createObjectURL(arquivo);
    previaImagem.src = urlPrevia;
    previaImagem.hidden = false;
});
document.querySelector('#limpar-imagem').addEventListener('click', () => {
    limparArquivoImagem();
    campoImagem.value = '';
    atualizarPreviaImagem();
});

function atualizarPreviaImagem() {
    const url = campoImagem.value.trim();
    previaImagem.hidden = true;
    previaImagem.removeAttribute('src');
    if (/^https?:\/\//i.test(url)) {
        previaImagem.src = url;
        previaImagem.hidden = false;
    }
}
campoImagem.addEventListener('input', () => { limparArquivoImagem(); atualizarPreviaImagem(); });
previaImagem.addEventListener('error', () => { previaImagem.hidden = true; });
const painelHistorico = document.querySelector('#historico');
const formularioHistorico = document.querySelector('#form-historico');
let animais = [];
let animalEditado = null;
let animalHistorico = null;
const rotulos = { cao: 'Cachorro', gato: 'Gato', femea: 'Fêmea', macho: 'Macho', pequeno: 'Pequeno', medio: 'Médio', grande: 'Grande', filhote: 'Filhote', adulto: 'Adulto', idoso: 'Idoso', disponivel: 'Disponível para adoção', 'em tratamento': 'Em tratamento', adotado: 'Adotado' };

function informar(texto) { mensagem.textContent = texto; mensagem.hidden = false; }
function elemento(tag, texto, classe) {
    const el = document.createElement(tag);
    el.textContent = texto;
    if (classe) el.className = classe;
    return el;
}
function mostrarAnimais() {
    const nome = document.querySelector('#busca-nome').value.trim().toLocaleLowerCase('pt-BR');
    const situacao = document.querySelector('#filtro-situacao').value;
    const resultados = animais.filter((animal) => animal.nome.toLocaleLowerCase('pt-BR').includes(nome) && (!situacao || animal.situacao === situacao));
    lista.replaceChildren();
    if (!resultados.length) lista.append(elemento('p', 'Nenhum animal encontrado.'));
    for (const animal of resultados) {
        const card = elemento('article', '', 'animal-admin');
        if (/^https?:\/\//i.test(animal.imagem_url || '')) {
            const foto = document.createElement('img');
            foto.src = animal.imagem_url;
            foto.alt = `Foto de ${animal.nome}`;
            foto.className = 'foto-animal-admin';
            foto.loading = 'lazy';
            foto.addEventListener('error', () => { foto.hidden = true; });
            card.append(foto);
        }
        card.append(elemento('h3', animal.nome), elemento('p', `${rotulos[animal.especie] || animal.especie} • ${rotulos[animal.sexo] || animal.sexo} • ${rotulos[animal.porte] || animal.porte}`), elemento('p', rotulos[animal.situacao] || animal.situacao));
        const acoes = elemento('div', '', 'barra-acoes');
        for (const [texto, acao] of [['Editar', () => abrirCadastro(animal)], ['Histórico', () => abrirHistorico(animal)]]) {
            const botao = elemento('button', texto, 'botao-admin secundario');
            botao.type = 'button';
            botao.setAttribute('aria-label', `${texto} de ${animal.nome}`);
            botao.addEventListener('click', acao);
            acoes.append(botao);
        }
        card.append(acoes);
        lista.append(card);
    }
}

async function carregarAnimais() {
    lista.setAttribute('aria-busy', 'true');
    try {
        const dados = await api.solicitar('/api/admin/animais', { autenticado: true });
        animais = dados.animais || [];
        mostrarAnimais();
        return true;
    } catch (erro) { informar(erro.message); return false; }
    finally { lista.setAttribute('aria-busy', 'false'); }
}

function abrirCadastro(animal = null) {
    animalEditado = animal;
    formulario.reset();
    limparArquivoImagem();
    campoImagem.value = animal?.imagem_url || '';
    if (animal) {
        for (const campo of formulario.elements) {
            if (!campo.name || animal[campo.name] === undefined) continue;
            if (campo.type === 'checkbox') campo.checked = animal[campo.name];
            else campo.value = animal[campo.name] ?? '';
        }
    }
    atualizarPreviaImagem();
    cadastro.hidden = false;
    document.querySelector('#titulo-cadastro').textContent = animal ? `Editar ${animal.nome}` : 'Cadastrar animal';
    document.querySelector('#titulo-cadastro').focus();
    cadastro.scrollIntoView({ block: 'start' });
}

document.querySelector('#novo-animal').addEventListener('click', () => abrirCadastro());
document.querySelector('#cancelar-animal').addEventListener('click', () => {
    limparArquivoImagem();
    cadastro.hidden = true;
    document.querySelector('#novo-animal').focus();
});
document.querySelector('#recarregar-animais').addEventListener('click', carregarAnimais);
document.querySelector('#busca-nome').addEventListener('input', mostrarAnimais);
document.querySelector('#filtro-situacao').addEventListener('change', mostrarAnimais);

formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!formulario.reportValidity()) return;
    const dados = Object.fromEntries(new FormData(formulario));
    dados.nome = dados.nome.trim();
    dados.imagem_url = campoImagem.value.trim() || null;
    if (dados.nome.length < 2) { informar('Informe um nome com pelo menos duas letras.'); formulario.elements.nome.focus(); return; }
    dados.convivencia_criancas = formulario.elements.convivencia_criancas.checked;
    dados.convivencia_outros_animais = formulario.elements.convivencia_outros_animais.checked;
    const botao = formulario.querySelector('[type=submit]');
    botao.disabled = true;
    botao.textContent = 'Salvando...';
    campoArquivo.disabled = true;
    campoImagem.disabled = true;
    document.querySelector('#limpar-imagem').disabled = true;
    try {
        if (arquivoImagem) {
            botao.textContent = 'Enviando foto...';
            const upload = await api.solicitar('/api/animais/imagem', {
                autenticado: true, method: 'POST',
                headers: { 'Content-Type': arquivoImagem.type }, body: arquivoImagem
            });
            dados.imagem_url = upload.imagem_url;
            campoImagem.value = upload.imagem_url;
            limparArquivoImagem();
            atualizarPreviaImagem();
            botao.textContent = 'Salvando...';
        }
        await api.solicitar(animalEditado ? `/api/animais/${encodeURIComponent(animalEditado.id)}` : '/api/animais', {
            autenticado: true, method: animalEditado ? 'PUT' : 'POST', body: JSON.stringify(dados)
        });
        cadastro.hidden = true;
        const atualizado = await carregarAnimais();
        informar(atualizado ? 'Animal salvo com sucesso.' : 'Animal salvo. Não foi possível atualizar a lista; clique em Atualizar lista.');
        document.querySelector('#novo-animal').focus();
    } catch (erro) { informar(erro.message); }
    finally {
        botao.disabled = false; botao.textContent = 'Salvar animal';
        campoArquivo.disabled = false;
        campoImagem.disabled = false;
        document.querySelector('#limpar-imagem').disabled = false;
    }
});

const camposRegistro = {
    resgates: [['data_resgate','Data do resgate','date'],['local_resgate','Local do resgate','text'],['motivo','Motivo','text']],
    saude: [['data_registro','Data do registro','date'],['descricao','Descrição','text']],
    vacinas: [['nome','Nome da vacina','text'],['data_aplicacao','Data de aplicação','date'],['proxima_dose','Próxima dose','date',false]],
    tratamentos: [['descricao','Descrição','text'],['inicio','Início','date'],['fim','Fim','date',false]]
};
function montarCamposRegistro() {
    const tipo = document.querySelector('#tipo-registro').value;
    const container = document.querySelector('#campos-registro');
    container.replaceChildren();
    for (const [nome, rotulo, type, obrigatorio = true] of [...camposRegistro[tipo], ['observacoes','Observações','text',false]]) {
        const div = elemento('div', '', 'campo-admin');
        const label = elemento('label', rotulo);
        label.htmlFor = `registro-${nome}`;
        const input = document.createElement('input');
        input.id = label.htmlFor;
        input.name = nome;
        input.type = type;
        input.required = obrigatorio;
        if (type === 'text') { input.minLength = obrigatorio ? 2 : 0; input.maxLength = 2000; }
        div.append(label, input);
        container.append(div);
    }
    if (tipo === 'tratamentos') {
        const div = elemento('div', '', 'campo-admin');
        const label = elemento('label', 'Status do tratamento');
        label.htmlFor = 'registro-status';
        const select = document.createElement('select');
        select.id = label.htmlFor;
        select.name = 'status';
        for (const [valor, rotulo] of [['ativo','Ativo'],['concluido','Concluído'],['cancelado','Cancelado']]) {
            const opcao = elemento('option', rotulo);
            opcao.value = valor;
            select.append(opcao);
        }
        div.append(label, select);
        container.append(div);
    }
}

async function abrirHistorico(animal) {
    animalHistorico = animal;
    painelHistorico.hidden = false;
    document.querySelector('#titulo-historico').textContent = `Histórico de ${animal.nome}`;
    document.querySelector('#titulo-historico').focus();
    const container = document.querySelector('#historico-registros');
    container.replaceChildren(elemento('p', 'Carregando histórico...'));
    try {
        const dados = await api.solicitar(`/api/animais/${encodeURIComponent(animal.id)}/historico`, { autenticado: true });
        container.replaceChildren();
        const titulos = { resgates: 'Resgates', registros_saude: 'Saúde', vacinas: 'Vacinas', tratamentos: 'Tratamentos', adocoes: 'Adoções' };
        for (const [tipo, titulo] of Object.entries(titulos)) {
            const secao = document.createElement('section');
            secao.append(elemento('h3', titulo));
            const registros = dados.historico[tipo] || [];
            if (!registros.length) secao.append(elemento('p', 'Nenhum registro.'));
            for (const registro of registros) {
                const linha = elemento('div', '', 'linha-registro');
                for (const [nome, valor] of Object.entries(registro)) {
                    if (['id','animal_id','criado_em','adotante_id'].includes(nome) || valor === null || valor === '') continue;
                    linha.append(elemento('p', `${nome.replaceAll('_', ' ')}: ${valor}`));
                }
                secao.append(linha);
            }
            container.append(secao);
        }
    } catch (erro) {
        container.replaceChildren(elemento('p', 'Não foi possível carregar o histórico. Feche e abra novamente para tentar.'));
        informar(erro.message);
    }
}

document.querySelector('#tipo-registro').addEventListener('change', montarCamposRegistro);
document.querySelector('#fechar-historico').addEventListener('click', () => {
    painelHistorico.hidden = true;
    document.querySelector('#novo-animal').focus();
});
formularioHistorico.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!animalHistorico || !formularioHistorico.reportValidity()) return;
    const dados = Object.fromEntries(new FormData(formularioHistorico));
    const tipo = dados['tipo-registro'];
    delete dados['tipo-registro'];
    for (const nome of Object.keys(dados)) { dados[nome] = dados[nome].trim(); if (!dados[nome]) delete dados[nome]; }
    if (dados.inicio && dados.fim && dados.fim < dados.inicio) { informar('O fim do tratamento deve ser igual ou posterior ao início.'); return; }
    const botao = formularioHistorico.querySelector('[type=submit]');
    botao.disabled = true;
    try {
        await api.solicitar(`/api/animais/${encodeURIComponent(animalHistorico.id)}/${tipo}`, { autenticado: true, method: 'POST', body: JSON.stringify(dados) });
        montarCamposRegistro();
        await abrirHistorico(animalHistorico);
        informar('Registro salvo com sucesso.');
    } catch (erro) { informar(erro.message); }
    finally { botao.disabled = false; }
});

montarCamposRegistro();
carregarAnimais().then(() => { if (window.location.hash === '#cadastro') abrirCadastro(); });
