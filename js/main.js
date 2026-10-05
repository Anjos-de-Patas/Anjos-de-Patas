const botoesFiltro = document.querySelectorAll(".filtro");
let cardsAnimais = document.querySelectorAll(".card-animal");

const textoFiltrosAtivos = document.getElementById("filtros-ativos");
const botaoLimparFiltros = document.getElementById("limpar-filtros");
const mensagemSemResultados = document.getElementById("sem-resultados");

let filtroEspecie = "todos";
let filtroSexo = "todos";

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
    let quantidadeVisivel = 0;

    cardsAnimais.forEach((card) => {
        const especie = card.dataset.especie;
        const sexo = card.dataset.sexo;

        const correspondeEspecie =
            filtroEspecie === "todos" ||
            especie === filtroEspecie;

        const correspondeSexo =
            filtroSexo === "todos" ||
            sexo === filtroSexo;

        const deveMostrar =
            correspondeEspecie && correspondeSexo;

        card.hidden = !deveMostrar;

        if (deveMostrar) {
            quantidadeVisivel++;
        }
    });

    mensagemSemResultados.hidden = quantidadeVisivel > 0;

    atualizarResumoFiltros();
}


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

        aplicarFiltros();
    });
});


botaoLimparFiltros.addEventListener("click", () => {
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
    listaPublica.replaceChildren();
    cardsAnimais = [];
    mensagemCatalogo.hidden = false;
    mensagemCatalogo.textContent = 'Carregando animais disponíveis...';
    mensagemSemResultados.hidden = true;
    botaoRecarregarCatalogo.hidden = true;
    listaPublica.setAttribute('aria-busy', 'true');
    try {
        const dados = await window.AnjosAPI.solicitar('/api/animais');
        const animais = (dados.animais || []).filter((animal) => animal.situacao === 'disponivel');
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


// Assistente

const API_AGENTE =
    `${window.AnjosAPI.base}/api/agente`;

const botaoChatFlutuante =
    document.getElementById("botao-chat-flutuante");

const botoesAbrirChat =
    document.querySelectorAll("[data-abrir-chat]");

const janelaChat =
    document.getElementById("janela-chat");

const botaoFecharChat =
    document.getElementById("fechar-chat");

const formularioChat =
    document.getElementById("formulario-chat");

const campoMensagem =
    document.getElementById("mensagem-chat");

const areaMensagens =
    document.getElementById("mensagens-chat");

const sugestoesChat =
    document.querySelectorAll(".sugestao-chat");

const botaoEnviarChat =
    formularioChat.querySelector('button[type="submit"]');

let ultimoElementoFocado = null;
let chatEmAnimacao = false;
let mensagemEmEnvio = false;
let conversaId = null;


// Pequeno movimento para chamar atenção sem abrir o chat

const usuarioPrefereMenosMovimento =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!usuarioPrefereMenosMovimento) {
    setTimeout(() => {
        if (janelaChat.hidden) {
            botaoChatFlutuante.classList.add("chamar-atencao");

            setTimeout(() => {
                botaoChatFlutuante.classList.remove("chamar-atencao");
            }, 1200);
        }
    }, 2200);
}


function abrirChat(origem) {
    if (chatEmAnimacao || !janelaChat.hidden) {
        return;
    }

    ultimoElementoFocado =
        origem || document.activeElement;

    chatEmAnimacao = true;

    janelaChat.hidden = false;

    janelaChat.setAttribute(
        "aria-hidden",
        "false"
    );

    botaoChatFlutuante.setAttribute(
        "aria-expanded",
        "true"
    );

    botoesAbrirChat.forEach((botao) => {
        botao.setAttribute(
            "aria-expanded",
            "true"
        );
    });

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            janelaChat.classList.add("chat-visivel");
        });
    });

    setTimeout(() => {
        chatEmAnimacao = false;
        campoMensagem.focus();
    }, 230);
}


function fecharChat() {
    if (chatEmAnimacao || janelaChat.hidden) {
        return;
    }

    chatEmAnimacao = true;

    janelaChat.classList.remove("chat-visivel");
    janelaChat.classList.add("chat-fechando");

    botaoChatFlutuante.setAttribute(
        "aria-expanded",
        "false"
    );

    botoesAbrirChat.forEach((botao) => {
        botao.setAttribute(
            "aria-expanded",
            "false"
        );
    });

    setTimeout(() => {
        janelaChat.hidden = true;

        janelaChat.classList.remove("chat-fechando");

        janelaChat.setAttribute(
            "aria-hidden",
            "true"
        );

        chatEmAnimacao = false;

        if (
            ultimoElementoFocado &&
            typeof ultimoElementoFocado.focus === "function"
        ) {
            ultimoElementoFocado.focus();
        }
    }, 220);
}


botaoChatFlutuante.addEventListener("click", () => {
    if (janelaChat.hidden) {
        abrirChat(botaoChatFlutuante);
    } else {
        fecharChat();
    }
});


botoesAbrirChat.forEach((botao) => {
    botao.addEventListener("click", () => {
        abrirChat(botao);
    });
});


botaoFecharChat.addEventListener(
    "click",
    fecharChat
);


document.addEventListener("keydown", (evento) => {
    if (
        evento.key === "Escape" &&
        !janelaChat.hidden
    ) {
        fecharChat();
    }
});


function adicionarMensagem(texto, tipo) {
    const mensagem = document.createElement("div");

    mensagem.classList.add(
        "mensagem",
        tipo
    );

    const paragrafo = document.createElement("p");
    paragrafo.textContent = texto;

    mensagem.appendChild(paragrafo);
    areaMensagens.appendChild(mensagem);

    areaMensagens.scrollTop =
        areaMensagens.scrollHeight;

    return mensagem;
}


function definirEstadoEnvio(enviando) {
    mensagemEmEnvio = enviando;

    campoMensagem.disabled = enviando;

    if (botaoEnviarChat) {
        botaoEnviarChat.disabled = enviando;
    }

    sugestoesChat.forEach((botao) => {
        botao.disabled = enviando;
    });
}


async function consultarAgente(mensagem) {
    const corpo = {
        mensagem
    };

    if (conversaId) {
        corpo.conversa_id = conversaId;
    }

    const resposta = await fetch(
        API_AGENTE,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(corpo)
        }
    );

    let dados;

    try {
        dados = await resposta.json();
    } catch {
        throw new Error(
            "O servidor retornou uma resposta inválida."
        );
    }

    if (!resposta.ok || !dados.sucesso) {
        throw new Error(
            dados.erro ||
            "Não foi possível consultar o assistente."
        );
    }

    return dados;
}


async function enviarMensagem(texto) {
    const mensagem = texto.trim();

    if (!mensagem || mensagemEmEnvio) {
        return;
    }

    adicionarMensagem(
        mensagem,
        "mensagem-usuario"
    );

    campoMensagem.value = "";

    definirEstadoEnvio(true);

    const mensagemCarregando =
        adicionarMensagem(
            "Estou procurando uma opção para você...",
            "mensagem-assistente"
        );

    try {
        const resposta =
            await consultarAgente(mensagem);

        mensagemCarregando.remove();

        if (resposta.conversa_id) {
            conversaId = resposta.conversa_id;
        }

        adicionarMensagem(
            resposta.mensagem,
            "mensagem-assistente"
        );
    } catch (erro) {
        console.error(
            "Erro ao consultar o assistente:",
            erro
        );

        mensagemCarregando.remove();

        adicionarMensagem(
            "Não consegui acessar o assistente agora. Tente novamente em alguns instantes.",
            "mensagem-assistente"
        );
    } finally {
        definirEstadoEnvio(false);
        campoMensagem.focus();
    }
}


formularioChat.addEventListener("submit", (evento) => {
    evento.preventDefault();

    enviarMensagem(campoMensagem.value);
});


sugestoesChat.forEach((botao) => {
    botao.addEventListener("click", () => {
        enviarMensagem(botao.dataset.mensagem);
    });
});


aplicarFiltros();
