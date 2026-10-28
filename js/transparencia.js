const estadoResultados = document.querySelector('#estado-resultados');
const tentarResultados = document.querySelector('#recarregar-resultados');
async function carregarResultados() {
    estadoResultados.hidden = false;
    estadoResultados.textContent = 'Consultando indicadores...';
    tentarResultados.hidden = true;
    document.querySelector('#indicadores').hidden = true;
    document.querySelector('#atualizacao-resultados').textContent = '';
    try {
        const resultado = await window.AnjosAPI.solicitar('/api/resultados');
        const valores = [resultado.dados.animais_acolhidos, resultado.dados.disponiveis, resultado.dados.adocoes_registradas];
        if (!valores.every((n) => Number.isSafeInteger(n) && n >= 0)) throw new Error('Indicadores indisponíveis. Tente novamente mais tarde.');
        ['#total-acolhidos', '#total-disponiveis', '#total-adocoes'].forEach((id, i) => {
            document.querySelector(id).textContent = valores[i].toLocaleString('pt-BR');
        });
        if (!Number.isFinite(Date.parse(resultado.atualizado_em))) throw new Error('Data de consulta inválida.');
        document.querySelector('#atualizacao-resultados').textContent = `Consulta realizada em ${new Date(resultado.atualizado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (horário de Brasília).`;
        document.querySelector('#indicadores').hidden = false;
        estadoResultados.hidden = true;
    } catch {
        estadoResultados.textContent = 'Os indicadores estão temporariamente indisponíveis. Nenhum valor estimado é apresentado.';
        tentarResultados.hidden = false;
    }
}
tentarResultados.addEventListener('click', carregarResultados);
carregarResultados();
