const API_LOGIN = `${window.AnjosAPI.base}/api/login`;

const formularioLogin = document.querySelector("#formulario-login");
const campoEmail = document.querySelector("#email");
const campoSenha = document.querySelector("#senha");
const botaoLogin = document.querySelector("#botao-login");
const mensagemLogin = document.querySelector("#mensagem-login");
const botaoAlternarSenha = document.querySelector("#alternar-senha");

function exibirMensagem(mensagem) {
    mensagemLogin.textContent = mensagem;
    mensagemLogin.hidden = false;
}

function limparMensagem() {
    mensagemLogin.textContent = "";
    mensagemLogin.hidden = true;
}

function definirCarregamento(carregando) {
    botaoLogin.disabled = carregando;
    campoEmail.disabled = carregando;
    campoSenha.disabled = carregando;

    botaoLogin.textContent = carregando
        ? "Entrando..."
        : "Entrar";
}

function salvarSessao(dados) {
    sessionStorage.setItem(
        "anjos_token",
        dados.token
    );

    sessionStorage.setItem(
        "anjos_usuario",
        JSON.stringify(dados.usuario)
    );
}

async function realizarLogin(email, senha) {
    const resposta = await fetch(API_LOGIN, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email,
            password: senha
        })
    });

    let dados;

    try {
        dados = await resposta.json();
    } catch {
        throw new Error(
            "Não foi possível interpretar a resposta do servidor."
        );
    }

    if (!resposta.ok) {
        throw new Error(
            dados.erro ||
            "Não foi possível realizar o login."
        );
    }

    if (
        !dados.sucesso ||
        !dados.token ||
        !dados.usuario
    ) {
        throw new Error(
            "O servidor retornou uma sessão inválida."
        );
    }

    return dados;
}

botaoAlternarSenha.addEventListener("click", () => {
    const senhaVisivel =
        campoSenha.type === "text";

    campoSenha.type = senhaVisivel
        ? "password"
        : "text";

    botaoAlternarSenha.textContent =
        senhaVisivel
            ? "Mostrar"
            : "Ocultar";

    botaoAlternarSenha.setAttribute(
        "aria-label",
        senhaVisivel
            ? "Mostrar senha"
            : "Ocultar senha"
    );

    botaoAlternarSenha.setAttribute(
        "aria-pressed",
        String(!senhaVisivel)
    );

    campoSenha.focus();
});

formularioLogin.addEventListener(
    "submit",
    async (evento) => {
        evento.preventDefault();

        limparMensagem();

        const email =
            campoEmail.value.trim();

        const senha =
            campoSenha.value;

        if (!email || !senha) {
            exibirMensagem(
                "Informe o e-mail e a senha."
            );
            return;
        }

        if (!campoEmail.validity.valid) {
            exibirMensagem(
                "Informe um endereço de e-mail válido."
            );
            campoEmail.focus();
            return;
        }

        definirCarregamento(true);

        try {
            const dados =
                await realizarLogin(
                    email,
                    senha
                );

            salvarSessao(dados);

            window.location.href =
                "dashboard.html";
        } catch (erro) {
            exibirMensagem(
                erro.message ||
                "Não foi possível realizar o login."
            );
        } finally {
            definirCarregamento(false);
        }
    }
);
