const botoesFiltro = document.querySelectorAll(".filtro");
let cardsAnimais = document.querySelectorAll(".card-animal");

const textoFiltrosAtivos = document.getElementById("filtros-ativos");
const botaoLimparFiltros = document.getElementById("limpar-filtros");
const mensagemSemResultados = document.getElementById("sem-resultados");

let filtroEspecie = "todos";
let filtroSexo = "todos";
const animaisPorPagina = 6;
let paginaAtual = 1;
let totalPaginas = 1;
const paginacaoCatalogo = document.querySelector('#paginacao-catalogo');
const resumoPaginacao = document.querySelector('#resumo-paginacao');
const paginaAnterior = document.querySelector('#pagina-anterior');
const paginaProxima = document.querySelector('#pagina-proxima');

const nomesEspecies = {
    cao: "Cachorros",
    gato: "Gatos"
};

const nomesSexos = {
    femea: "Fêmeas",
    macho: "Machos"
};


function atualizarResumoFiltros() {
    const filtrosSelecionados = [];

    if (filtroEspecie !== "todos") {
        filtrosSelecionados.push(nomesEspecies[filtroEspecie]);
    }

    if (filtroSexo !== "todos") {
        filtrosSelecionados.push(nomesSexos[filtroSexo]);
    }

    if (filtrosSelecionados.length === 0) {
        textoFiltrosAtivos.textContent = "Exibindo todos os animais";
        botaoLimparFiltros.hidden = true;
        return;
    }

    textoFiltrosAtivos.textContent =
        `Filtros ativos: ${filtrosSelecionados.join(" • ")}`;

    botaoLimparFiltros.hidden = false;
}


function aplicarFiltros() {
    const correspondentes = [...cardsAnimais].filter((card) => {
        const especie = card.dataset.especie;
        const sexo = card.dataset.sexo;

        const correspondeEspecie =
            filtroEspecie === "todos" ||
            especie === filtroEspecie;

        const correspondeSexo =
            filtroSexo === "todos" ||
            sexo === filtroSexo;

        return correspondeEspecie && correspondeSexo;
    });
    totalPaginas = Math.max(1, Math.ceil(correspondentes.length / animaisPorPagina));
    paginaAtual = Math.min(paginaAtual, totalPaginas);
    const inicio = (paginaAtual - 1) * animaisPorPagina;
    const visiveis = new Set(correspondentes.slice(inicio, inicio + animaisPorPagina));
    cardsAnimais.forEach(card => { card.hidden = !visiveis.has(card); });
    mensagemSemResultados.hidden = correspondentes.length > 0;
    paginacaoCatalogo.hidden = correspondentes.length === 0;
    paginaAnterior.disabled = paginaAtual === 1;
    paginaProxima.disabled = paginaAtual === totalPaginas;
    paginaAnterior.hidden = paginaProxima.hidden = totalPaginas === 1;
    resumoPaginacao.textContent = correspondentes.length
        ? `${inicio + 1}–${Math.min(inicio + animaisPorPagina, correspondentes.length)} de ${correspondentes.length} animais · Página ${paginaAtual} de ${totalPaginas}`
        : '';
    atualizarResumoFiltros();
}

function mudarPagina(direcao) {
    const proxima = paginaAtual + direcao;
    if (proxima < 1 || proxima > totalPaginas) return;
    paginaAtual = proxima;
    aplicarFiltros();
    document.querySelector('#adote').scrollIntoView({ block: 'start' });
}
paginaAnterior.addEventListener('click', () => mudarPagina(-1));
paginaProxima.addEventListener('click', () => mudarPagina(1));


botoesFiltro.forEach((botao) => {
    botao.addEventListener("click", () => {
        const tipo = botao.dataset.tipo;
        const valor = botao.dataset.valor;

        botoesFiltro.forEach((item) => {
            if (item.dataset.tipo === tipo) {
                item.classList.remove("ativo");
                item.setAttribute("aria-pressed", "false");
            }
        });

        botao.classList.add("ativo");
        botao.setAttribute("aria-pressed", "true");

        if (tipo === "especie") {
            filtroEspecie = valor;
        }

        if (tipo === "sexo") {
            filtroSexo = valor;
        }

        paginaAtual = 1;
        aplicarFiltros();
    });
});


botaoLimparFiltros.addEventListener("click", () => {
    paginaAtual = 1;
    filtroEspecie = "todos";
    filtroSexo = "todos";

    botoesFiltro.forEach((botao) => {
        const deveAtivar = botao.dataset.valor === "todos";

        botao.classList.toggle("ativo", deveAtivar);

        botao.setAttribute(
            "aria-pressed",
            String(deveAtivar)
        );
    });

    aplicarFiltros();
});



// Detalhes dos animais

document.querySelector('.lista-animais').addEventListener('click', (evento) => {
        const botao = evento.target.closest('.botao-detalhes');
        if (!botao) return;
        const idDetalhes =
            botao.getAttribute("aria-controls");

        const detalhes =
            document.getElementById(idDetalhes);

        if (!detalhes) {
            return;
        }

        const estaAberto =
            botao.getAttribute("aria-expanded") === "true";

        detalhes.hidden = estaAberto;

        botao.setAttribute(
            "aria-expanded",
            String(!estaAberto)
        );

        botao.textContent =
            estaAberto
                ? "Ver detalhes"
                : "Ver menos";
});

const listaPublica = document.querySelector('.lista-animais');
const modeloCard = document.querySelector('#modelo-card-animal').content.querySelector('.card-animal');
const mensagemCatalogo = document.querySelector('#mensagem-catalogo');
const botaoRecarregarCatalogo = document.querySelector('#recarregar-catalogo');
const rotulosCatalogo = {
    cao: 'Cachorro', gato: 'Gato', femea: 'Fêmea', macho: 'Macho',
    pequeno: 'Pequeno porte', medio: 'Médio porte', grande: 'Grande porte',
    filhote: 'Filhote', adulto: 'Adulto', idoso: 'Idoso'
};

function criarCardPublico(animal, indice) {
    const card = modeloCard.cloneNode(true);
    card.dataset.especie = animal.especie;
    card.dataset.sexo = animal.sexo;
    card.querySelector('h3').textContent = animal.nome;
    card.querySelector('.tipo-animal').textContent = rotulosCatalogo[animal.especie] || 'Animal';
    card.querySelector('.imagem-placeholder p').textContent = `Foto de ${animal.nome} ainda não disponível`;
    if (/^https?:\/\//i.test(animal.imagem_url || '')) {
        const foto = document.createElement('img');
        foto.src = animal.imagem_url;
        foto.alt = `Foto de ${animal.nome}`;
        foto.loading = 'lazy';
        foto.style.cssText = 'width:100%;height:100%;object-fit:cover;';
        const placeholder = card.querySelector('.imagem-placeholder');
        placeholder.hidden = true;
        foto.addEventListener('error', () => { foto.remove(); placeholder.hidden = false; });
        card.querySelector('.card-imagem').append(foto);
    }
    card.querySelector('.card-conteudo > p').textContent = animal.temperamento || 'Consulte a equipe para saber mais sobre este animal.';
    card.querySelectorAll('.caracteristicas li').forEach((li, i) => {
        li.textContent = rotulosCatalogo[[animal.faixa_etaria, animal.sexo, animal.porte][i]] || 'Não informado';
    });
    const detalhes = card.querySelector('.detalhes-expandidos');
    const perfil = document.createElement('a');
    perfil.className = 'link-editorial';
    perfil.href = `pages/animal.html?id=${encodeURIComponent(animal.id)}`;
    perfil.textContent = 'Ver perfil completo';
    card.querySelector('.card-conteudo').append(perfil);
    card.querySelector('.botao-interesse').href = `pages/animal.html?id=${encodeURIComponent(animal.id)}#interesse`;
    detalhes.id = `detalhes-animal-${indice}`;
    detalhes.hidden = true;
    const botao = card.querySelector('.botao-detalhes');
    botao.setAttribute('aria-controls', detalhes.id);
    botao.setAttribute('aria-expanded', 'false');
    botao.setAttribute('aria-label', `Ver detalhes de ${animal.nome}`);
    const lista = detalhes.querySelector('dl');
    lista.replaceChildren();
    for (const [rotulo, valor] of [
        ['Temperamento', animal.temperamento || 'Não informado'],
        ['Convive com crianças', typeof animal.convivencia_criancas === 'boolean' ? (animal.convivencia_criancas ? 'Sim' : 'Não') : 'Não informado'],
        ['Convive com outros animais', typeof animal.convivencia_outros_animais === 'boolean' ? (animal.convivencia_outros_animais ? 'Sim' : 'Não') : 'Não informado']
    ]) {
        const div = document.createElement('div');
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = rotulo;
        dd.textContent = valor;
        div.append(dt, dd);
        lista.append(div);
    }
    return card;
}

async function carregarCatalogo() {
    paginaAtual = 1;
    paginacaoCatalogo.hidden = true;
    listaPublica.replaceChildren();
    cardsAnimais = [];
    mensagemCatalogo.hidden = false;
    mensagemCatalogo.textContent = 'Carregando animais disponíveis...';
    mensagemSemResultados.hidden = true;
    botaoRecarregarCatalogo.hidden = true;
    listaPublica.setAttribute('aria-busy', 'true');
    try {
        const dados = await window.AnjosAPI.solicitar('/api/animais');
        const disponiveis = (dados.animais || []).filter((animal) => animal.situacao === 'disponivel');
        const animais = disponiveis;
        listaPublica.replaceChildren(...animais.map(criarCardPublico));
        cardsAnimais = listaPublica.querySelectorAll('.card-animal');
        mensagemCatalogo.hidden = animais.length > 0;
        mensagemCatalogo.textContent = 'Nenhum animal disponível para adoção no momento.';
        aplicarFiltros();
        if (!animais.length) mensagemSemResultados.hidden = true;
    } catch {
        mensagemCatalogo.textContent = 'Não foi possível carregar os animais. Verifique a conexão e tente novamente.';
        botaoRecarregarCatalogo.hidden = false;
    } finally {
        listaPublica.setAttribute('aria-busy', 'false');
    }
}

botaoRecarregarCatalogo.addEventListener('click', carregarCatalogo);
carregarCatalogo();


// Destaque do menu

const linksMenu =
    document.querySelectorAll('.menu a[href^="#"]');

const secoesMenu = [];

linksMenu.forEach((link) => {
    const id = link.getAttribute("href");
    const secao = document.querySelector(id);

    if (secao) {
        secoesMenu.push({
            link,
            secao
        });
    }
});


function atualizarMenuAtivo() {
    const referencia = window.scrollY + 180;
    let linkAtivo = null;

    secoesMenu.forEach((item) => {
        if (item.secao.offsetTop <= referencia) {
            linkAtivo = item.link;
        }
    });

    linksMenu.forEach((link) => {
        link.classList.remove("ativo");
    });

    if (linkAtivo) {
        linkAtivo.classList.add("ativo");
    }
}


window.addEventListener(
    "scroll",
    atualizarMenuAtivo,
    { passive: true }
);

window.addEventListener(
    "resize",
    atualizarMenuAtivo
);

atualizarMenuAtivo();


aplicarFiltros();
