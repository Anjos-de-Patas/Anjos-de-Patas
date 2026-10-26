(() => {
    function digitos(valor) {
        let numero = String(valor || '').replace(/\D/g, '');
        if ((numero.length === 12 || numero.length === 13) && numero.startsWith('55')) numero = numero.slice(2);
        return numero;
    }
    function formatar(valor) {
        const numero = digitos(valor).slice(0, 11);
        if (!numero) return '';
        if (numero.length <= 2) return `(${numero}`;
        const local = numero.slice(2);
        const corte = local.length > 8 ? 5 : 4;
        return `(${numero.slice(0, 2)}) ${local.slice(0, corte)}${local.length > corte ? '-' + local.slice(corte) : ''}`;
    }
    window.AnjosTelefone = { digitos, formatar };
    document.querySelectorAll('input[data-telefone]').forEach((campo) => {
        campo.value = formatar(campo.value);
        campo.addEventListener('paste', evento => {
            const texto = evento.clipboardData?.getData('text');
            if (!texto) return;
            evento.preventDefault();
            const inicio = campo.selectionStart ?? 0;
            const fim = campo.selectionEnd ?? campo.value.length;
            // Processa o conteúdo inteiro antes do limite visual de 15 caracteres.
            campo.value = formatar(campo.value.slice(0, inicio) + texto + campo.value.slice(fim));
            campo.setSelectionRange(campo.value.length, campo.value.length);
            campo.dispatchEvent(new Event('input', { bubbles: true }));
        });
        campo.addEventListener('input', () => {
            const valor = campo.value;
            const cursor = campo.selectionStart ?? valor.length;
            const noFim = cursor === valor.length;
            const antes = valor.slice(0, cursor).replace(/\D/g, '').length;
            campo.value = formatar(valor);
            let posicao = campo.value.length;
            if (!noFim) {
                let vistos = 0;
                posicao = 0;
                while (posicao < campo.value.length && vistos < antes) {
                    if (/\d/.test(campo.value[posicao])) vistos++;
                    posicao++;
                }
            }
            campo.setSelectionRange(posicao, posicao);
        });
    });
})();
