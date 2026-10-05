(() => {
    if (!sessionStorage.getItem('anjos_token')) {
        window.location.replace('login.html');
        return;
    }
    let usuario = {};
    try { usuario = JSON.parse(sessionStorage.getItem('anjos_usuario') || '{}'); } catch {}
    document.querySelector('#usuario-nome').textContent = usuario.nome || 'Usuário';
    document.querySelector('.usuario-dados span').textContent = {
        admin: 'Administrador', voluntario: 'Voluntário', veterinario: 'Veterinário'
    }[usuario.perfil] || 'Área administrativa';
    document.querySelector('.usuario-avatar').textContent = (usuario.nome || 'U').charAt(0).toUpperCase();
    const menu = document.querySelector('#menu-lateral');
    const fundo = document.querySelector('#fundo-menu');
    const abrir = document.querySelector('#botao-abrir-menu');
    const fechar = document.querySelector('#botao-fechar-menu');
    function fecharMenu() {
        menu.classList.remove('aberto');
        fundo.classList.remove('ativo');
        document.body.classList.remove('menu-aberto');
        abrir.setAttribute('aria-expanded', 'false');
        abrir.focus();
    }
    abrir.addEventListener('click', () => {
        menu.classList.add('aberto');
        fundo.classList.add('ativo');
        document.body.classList.add('menu-aberto');
        abrir.setAttribute('aria-expanded', 'true');
        fechar.focus();
    });
    fechar.addEventListener('click', fecharMenu);
    fundo.addEventListener('click', fecharMenu);
    document.addEventListener('keydown', (evento) => {
        if (!menu.classList.contains('aberto')) return;
        if (evento.key === 'Escape') fecharMenu();
        if (evento.key === 'Tab' && window.matchMedia('(max-width:720px)').matches) {
            const controles = [...menu.querySelectorAll('a,button')].filter((el) => el.getClientRects().length);
            const primeiro = controles[0];
            const ultimo = controles.at(-1);
            if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo.focus(); }
            if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro.focus(); }
        }
    });
    window.addEventListener('resize', () => {
        if (!window.matchMedia('(max-width:720px)').matches) {
            menu.classList.remove('aberto');
            fundo.classList.remove('ativo');
            document.body.classList.remove('menu-aberto');
            abrir.setAttribute('aria-expanded', 'false');
        }
    });
    document.querySelector('#botao-sair').addEventListener('click', () => {
        sessionStorage.removeItem('anjos_token');
        sessionStorage.removeItem('anjos_usuario');
        window.location.replace('login.html');
    });
})();
