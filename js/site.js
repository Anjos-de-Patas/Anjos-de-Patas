// Navegação progressiva: sem JavaScript, os links permanecem acessíveis.
(() => {
    const nav = document.querySelector('body > .cabecalho .navegacao');
    const botao = document.querySelector('#alternar-menu-publico');
    if (!nav || !botao) return;
    const menu = document.querySelector('#menu-publico');
    const header = nav.closest('header');
    function atualizarAltura() {
        if (botao.getAttribute('aria-expanded') === 'true') return;
        document.documentElement.style.setProperty('--altura-cabecalho', `${Math.ceil(header.getBoundingClientRect().height)}px`);
    }
    nav.dataset.menuPronto = 'true';
    function definirMenu(aberto) {
        botao.setAttribute('aria-expanded', String(aberto));
        nav.classList.toggle('menu-publico-aberto', aberto);
        botao.textContent = aberto ? 'Fechar menu' : 'Menu';
        if (!aberto) atualizarAltura();
    }
    botao.addEventListener('click', () => definirMenu(botao.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (evento) => {
        if (evento.target.closest('a')) definirMenu(false);
    });
    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && botao.getAttribute('aria-expanded') === 'true') {
            definirMenu(false);
            botao.focus();
        }
    });
    window.addEventListener('resize', () => {
        if (window.matchMedia('(min-width: 901px)').matches) definirMenu(false);
        atualizarAltura();
    });
    document.addEventListener('click', (evento) => {
        if (botao.getAttribute('aria-expanded') === 'true' && !nav.contains(evento.target)) definirMenu(false);
    });
    if ('ResizeObserver' in window) new window.ResizeObserver(atualizarAltura).observe(header);
    atualizarAltura();
})();

// Mantem o botao fora da imagem de abertura e acima do rodape.
(() => {
    const assistente = document.querySelector('.area-chat-flutuante');
    const rodape = document.querySelector('footer.rodape');
    const abertura = document.querySelector('.hero');
    if (!assistente) return;
    let pendente = false;
    function atualizar() {
        const limite = rodape ? Math.max(0, window.innerHeight - rodape.getBoundingClientRect().top) : 0;
        assistente.style.setProperty('--rodape-visivel', `${limite}px`);
        const base = parseFloat(window.getComputedStyle(assistente).bottom) || 0;
        const topoNormal = window.innerHeight - base - assistente.offsetHeight;
        const deslocamento = abertura ? Math.max(0, abertura.getBoundingClientRect().bottom + 16 - topoNormal) : 0;
        assistente.style.setProperty('--deslocamento-abertura', `${deslocamento}px`);
        pendente = false;
    }
    function agendar() {
        if (pendente) return;
        pendente = true;
        window.requestAnimationFrame(atualizar);
    }
    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', agendar);
    window.addEventListener('load', agendar);
    if ('ResizeObserver' in window) {
        new window.ResizeObserver(agendar).observe(document.body);
    }
    atualizar();
})();
