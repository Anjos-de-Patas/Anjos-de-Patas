// Seleciona os botões de filtro
const botoesFiltro = document.querySelectorAll(".filtro");

// Seleciona todos os cards de animais
const cardsAnimais = document.querySelectorAll(".card-animal");


// Percorre todos os botões de filtro
botoesFiltro.forEach((botao) => {

    botao.addEventListener("click", () => {

        // Identifica o filtro selecionado
        const filtroSelecionado = botao.dataset.filtro;


        // Remove o estado ativo de todos os botões
        botoesFiltro.forEach((item) => {

            item.classList.remove("ativo");
            item.setAttribute("aria-pressed", "false");

        });


        // Define o botão clicado como ativo
        botao.classList.add("ativo");
        botao.setAttribute("aria-pressed", "true");


        // Percorre todos os cards de animais
        cardsAnimais.forEach((card) => {

            const especie = card.dataset.especie;
            const sexo = card.dataset.sexo;


            // Verifica se o animal corresponde ao filtro selecionado
            const deveMostrar =
                filtroSelecionado === "todos" ||
                filtroSelecionado === especie ||
                filtroSelecionado === sexo;


            // Exibe ou oculta o card
            card.hidden = !deveMostrar;

        });

    });

});