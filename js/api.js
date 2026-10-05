// Configuração pública. Este arquivo nunca deve conter chaves do Supabase.
window.AnjosAPI = {
    base: ['localhost', '127.0.0.1'].includes(window.location.hostname) && ['5500', '5173'].includes(window.location.port)
        ? 'http://localhost:3000'
        : window.location.origin,
    async solicitar(caminho, { autenticado = false, ...opcoes } = {}) {
        const headers = new Headers(opcoes.headers);
        if (opcoes.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
        if (autenticado) {
            const token = sessionStorage.getItem('anjos_token');
            if (!token) {
                window.location.replace('login.html');
                throw new Error('Faça login para continuar.');
            }
            headers.set('Authorization', `Bearer ${token}`);
        }
        const resposta = await fetch(this.base + caminho, { ...opcoes, headers });
        if (autenticado && [401, 403].includes(resposta.status)) {
            sessionStorage.removeItem('anjos_token');
            sessionStorage.removeItem('anjos_usuario');
            window.location.replace('login.html');
            throw new Error('Sessão encerrada. Faça login novamente.');
        }
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.erro || 'Não foi possível concluir a operação.');
        }
        return dados;
    }
};
