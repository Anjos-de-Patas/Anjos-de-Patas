const API_DASHBOARD = "http://localhost:3000/api/dashboard";

const totalAnimais = document.querySelector("#total-animais");
const totalAdocoes = document.querySelector("#total-adocoes");
const totalCuidados = document.querySelector("#total-cuidados");
const totalPedidos = document.querySelector("#total-pedidos");

const mensagemDashboard = document.querySelector("#mensagem-dashboard");
const usuarioNome = document.querySelector("#usuario-nome");
const usuarioPerfil = document.querySelector(".usuario-dados span");
const usuarioAvatar = document.querySelector(".usuario-avatar");

const botaoSair = document.querySelector("#botao-sair");

const menuLateral = document.querySelector("#menu-lateral");
const fundoMenu = document.querySelector("#fundo-menu");

const botaoAbrirMenu = document.querySelector("#botao-abrir-menu");
const botaoFecharMenu = document.querySelector("#botao-fechar-menu");

function obterToken() {
    return sessionStorage.getItem("anjos_token");
}

function obterUsuario() {
    const usuarioSalvo = sessionStorage.getItem("anjos_usuario");

    if (!usuarioSalvo) {
        return null;
    }

    try {
        return JSON.parse(usuarioSalvo);
    } catch {
        return null;
    }
}

function limparSessao() {
    sessionStorage.removeItem("anjos_token");
    sessionStorage.removeItem("anjos_usuario");
}

function irParaLogin() {
    window.location.replace("login.html");
}

function encerrarSessao() {
    limparSessao();
    irParaLogin();
}

function exibirMensagem(mensagem) {
    mensagemDashboard.textContent = mensagem;
    mensagemDashboard.hidden = false;
}

function formatarPerfil(perfil) {
    const perfis = {
        admin: "Administradora",
        voluntario: "Voluntário",
        veterinario: "Veterinário"
    };

    return perfis[perfil] || "Usuário";
}

function obterIniciais(nome) {
    if (!nome) {
        return "U";
    }

    const partesNome = nome
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (partesNome.length === 0) {
        return "U";
    }

    if (partesNome.length === 1) {
        return partesNome[0]
            .charAt(0)
            .toUpperCase();
    }

    return (
        partesNome[0].charAt(0) +
        partesNome[partesNome.length - 1].charAt(0)
    ).toUpperCase();
}

function preencherUsuario() {
    const usuario = obterUsuario();

    if (!usuario) {
        usuarioNome.textContent = "Usuário";
        usuarioPerfil.textContent = "Área administrativa";
        usuarioAvatar.textContent = "U";
        return;
    }

    usuarioNome.textContent =
        usuario.nome || usuario.email || "Usuário";

    usuarioPerfil.textContent =
        formatarPerfil(usuario.perfil);

    usuarioAvatar.textContent =
        obterIniciais(usuario.nome);
}

function preencherDashboard(dados) {
    totalAnimais.textContent =
        dados.animais_acolhidos ?? 0;

    totalAdocoes.textContent =
        dados.adocoes_concluidas ?? 0;

    totalCuidados.textContent =
        dados.cuidados_medicos ?? 0;

    totalPedidos.textContent =
        dados.pedidos_pendentes ?? 0;
}

function abrirMenu() {
    menuLateral.classList.add("aberto");
    fundoMenu.classList.add("ativo");

    document.body.classList.add("menu-aberto");

    botaoAbrirMenu.setAttribute(
        "aria-expanded",
        "true"
    );

    botaoFecharMenu.focus();
}

function fecharMenu(devolverFoco = true) {
    menuLateral.classList.remove("aberto");
    fundoMenu.classList.remove("ativo");

    document.body.classList.remove("menu-aberto");

    botaoAbrirMenu.setAttribute(
        "aria-expanded",
        "false"
    );

    if (devolverFoco) {
        botaoAbrirMenu.focus();
    }
}

function menuMobileAtivo() {
    return window.matchMedia(
        "(max-width: 720px)"
    ).matches;
}

async function carregarDashboard() {
    const token = obterToken();

    if (!token) {
        irParaLogin();
        return;
    }

    preencherUsuario();

    try {
        const resposta = await fetch(API_DASHBOARD, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        let dados;

        try {
            dados = await resposta.json();
        } catch {
            throw new Error(
                "Não foi possível interpretar a resposta do servidor."
            );
        }

        if (
            resposta.status === 401 ||
            resposta.status === 403
        ) {
            limparSessao();
            irParaLogin();
            return;
        }

        if (!resposta.ok) {
            throw new Error(
                dados.erro ||
                "Não foi possível carregar o Dashboard."
            );
        }

        if (!dados.sucesso || !dados.dados) {
            throw new Error(
                "O servidor retornou dados inválidos."
            );
        }

        preencherDashboard(dados.dados);

    } catch (erro) {
        exibirMensagem(
            erro.message ||
            "Não foi possível carregar as informações do Dashboard."
        );
    }
}

botaoAbrirMenu.addEventListener(
    "click",
    abrirMenu
);

botaoFecharMenu.addEventListener(
    "click",
    () => fecharMenu()
);

fundoMenu.addEventListener(
    "click",
    () => fecharMenu()
);

document.addEventListener(
    "keydown",
    (evento) => {
        if (
            evento.key === "Escape" &&
            menuLateral.classList.contains("aberto")
        ) {
            fecharMenu();
        }
    }
);

window.addEventListener(
    "resize",
    () => {
        if (!menuMobileAtivo()) {
            menuLateral.classList.remove("aberto");
            fundoMenu.classList.remove("ativo");

            document.body.classList.remove(
                "menu-aberto"
            );

            botaoAbrirMenu.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    }
);

botaoSair.addEventListener(
    "click",
    encerrarSessao
);

carregarDashboard();