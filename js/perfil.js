const API_PERFIL = "http://localhost:3000/api/perfil";

const formularioPerfil =
    document.querySelector("#formulario-perfil");

const campoNome =
    document.querySelector("#nome");

const campoEmail =
    document.querySelector("#email");

const campoPerfil =
    document.querySelector("#perfil");

const perfilAvatar =
    document.querySelector("#perfil-avatar");

const mensagemPerfil =
    document.querySelector("#mensagem-perfil");

const botaoSalvar =
    document.querySelector("#botao-salvar");

const modalSucesso =
    document.querySelector("#modal-sucesso");

const botaoConfirmar =
    document.querySelector("#botao-confirmar");

function obterToken() {
    return sessionStorage.getItem("anjos_token");
}

function obterUsuarioLocal() {
    const usuarioSalvo =
        sessionStorage.getItem("anjos_usuario");

    if (!usuarioSalvo) {
        return null;
    }

    try {
        return JSON.parse(usuarioSalvo);
    } catch {
        return null;
    }
}

function salvarUsuarioLocal(usuario) {
    sessionStorage.setItem(
        "anjos_usuario",
        JSON.stringify(usuario)
    );
}

function limparSessao() {
    sessionStorage.removeItem("anjos_token");
    sessionStorage.removeItem("anjos_usuario");
}

function irParaLogin() {
    window.location.replace("login.html");
}

function irParaDashboard() {
    window.location.replace("dashboard.html");
}

function tratarSessaoInvalida(resposta) {
    if (
        resposta.status === 401 ||
        resposta.status === 403
    ) {
        limparSessao();
        irParaLogin();

        return true;
    }

    return false;
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

function preencherPerfil(usuario) {
    campoNome.value =
        usuario.nome || "";

    campoEmail.value =
        usuario.email || "";

    campoPerfil.value =
        formatarPerfil(usuario.perfil);

    perfilAvatar.textContent =
        obterIniciais(usuario.nome);
}

function exibirErro(mensagem) {
    mensagemPerfil.textContent = mensagem;
    mensagemPerfil.hidden = false;
}

function limparErro() {
    mensagemPerfil.textContent = "";
    mensagemPerfil.hidden = true;
}

function definirCarregamento(carregando) {
    campoNome.disabled = carregando;
    botaoSalvar.disabled = carregando;

    botaoSalvar.textContent =
        carregando
            ? "Salvando..."
            : "Salvar alterações";
}

function abrirModalSucesso() {
    modalSucesso.hidden = false;

    document.body.classList.add(
        "modal-aberto"
    );

    botaoConfirmar.focus();
}

function fecharModalEVoltar() {
    modalSucesso.hidden = true;

    document.body.classList.remove(
        "modal-aberto"
    );

    irParaDashboard();
}

async function lerResposta(resposta) {
    try {
        return await resposta.json();
    } catch {
        throw new Error(
            "Não foi possível interpretar a resposta do servidor."
        );
    }
}

async function carregarPerfil() {
    const token = obterToken();

    if (!token) {
        irParaLogin();
        return;
    }

    const usuarioLocal =
        obterUsuarioLocal();

    if (usuarioLocal) {
        preencherPerfil(usuarioLocal);
    }

    try {
        const resposta = await fetch(
            API_PERFIL,
            {
                method: "GET",

                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (
            tratarSessaoInvalida(resposta)
        ) {
            return;
        }

        const dados =
            await lerResposta(resposta);

        if (!resposta.ok) {
            throw new Error(
                dados.erro ||
                "Não foi possível carregar o perfil."
            );
        }

        if (
            !dados.sucesso ||
            !dados.usuario
        ) {
            throw new Error(
                "O servidor retornou dados inválidos."
            );
        }

        preencherPerfil(
            dados.usuario
        );

        salvarUsuarioLocal(
            dados.usuario
        );

    } catch (erro) {
        exibirErro(
            erro.message ||
            "Não foi possível carregar o perfil."
        );
    }
}

async function atualizarPerfil(nome) {
    const token = obterToken();

    if (!token) {
        irParaLogin();
        return null;
    }

    const resposta = await fetch(
        API_PERFIL,
        {
            method: "PUT",

            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },

            body: JSON.stringify({
                nome
            })
        }
    );

    if (
        tratarSessaoInvalida(resposta)
    ) {
        return null;
    }

    const dados =
        await lerResposta(resposta);

    if (!resposta.ok) {
        throw new Error(
            dados.erro ||
            "Não foi possível atualizar o perfil."
        );
    }

    if (
        !dados.sucesso ||
        !dados.usuario
    ) {
        throw new Error(
            "O servidor retornou dados inválidos."
        );
    }

    return dados.usuario;
}

formularioPerfil.addEventListener(
    "submit",
    async (evento) => {
        evento.preventDefault();

        limparErro();

        const nome =
            campoNome.value.trim();

        if (nome.length < 2) {
            exibirErro(
                "Informe um nome válido."
            );

            campoNome.focus();

            return;
        }

        definirCarregamento(true);

        try {
            const usuarioAtualizado =
                await atualizarPerfil(nome);

            if (!usuarioAtualizado) {
                return;
            }

            salvarUsuarioLocal(
                usuarioAtualizado
            );

            preencherPerfil(
                usuarioAtualizado
            );

            definirCarregamento(false);

            abrirModalSucesso();

        } catch (erro) {
            exibirErro(
                erro.message ||
                "Não foi possível atualizar o perfil."
            );

            definirCarregamento(false);
        }
    }
);

botaoConfirmar.addEventListener(
    "click",
    fecharModalEVoltar
);

document.addEventListener(
    "keydown",
    (evento) => {
        if (
            evento.key === "Enter" &&
            !modalSucesso.hidden
        ) {
            evento.preventDefault();
            fecharModalEVoltar();
        }
    }
);

carregarPerfil();