import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';

function ambiente(pagina, solicitar) {
    const { document, window } = parseHTML(fs.readFileSync(pagina, 'utf8'));
    for (const select of document.querySelectorAll('select')) {
        Object.defineProperty(select, 'value', {
            configurable: true,
            get() { return this.querySelector('option[selected]')?.value ?? this.querySelector('option')?.value ?? ''; },
            set(valor) { for (const option of this.querySelectorAll('option')) option.selected = option.value === String(valor); }
        });
    }
    const sessao = new Map([['anjos_token', 'token-de-teste']]);
    const context = vm.createContext({
        window: {
            AnjosAPI: { base: 'http://localhost:3000', solicitar },
            location: { hash: '', replace() {} },
            matchMedia: () => ({ matches: true }),
            addEventListener() {}, scrollY: 0
        },
        document, console, Headers,
        URL: { createObjectURL: () => 'blob:foto-teste', revokeObjectURL() {} },
        sessionStorage: { getItem: (chave) => sessao.get(chave), removeItem: (chave) => sessao.delete(chave) },
        requestAnimationFrame: (callback) => callback(),
        setTimeout: (callback) => { callback(); return 0; },
        FormData: class {
            constructor(form) { this.form = form; }
            *[Symbol.iterator]() {
                for (const el of this.form.querySelectorAll('input,select,textarea')) {
                    if (el.name && !el.disabled && (el.type !== 'checkbox' || el.checked)) yield [el.name, el.value];
                }
            }
        }
    });
    for (const form of document.querySelectorAll('form')) {
        const controles = [...form.querySelectorAll('input,select,textarea,button')];
        for (const el of controles) if (el.name) controles[el.name] = el;
        form.elements = controles;
        form.reportValidity = () => true;
        form.reset = () => {};
    }
    for (const el of document.querySelectorAll('*')) { el.focus = () => {}; el.scrollIntoView = () => {}; }
    return {
        document, window, context,
        executar(arquivo) { vm.runInContext(fs.readFileSync(arquivo,'utf8'), context, { filename: arquivo }); }
    };
}
const aguardar = () => new Promise((resolve) => setImmediate(resolve));

test('foto local é enviada antes de salvar e falha de upload mantém formulário aberto', async () => {
    const chamadas = [];
    let falhar = true;
    const env = ambiente('pages/animais.html', async (caminho, opcoes) => {
        chamadas.push({ caminho, opcoes });
        if (caminho === '/api/animais/imagem') {
            if (falhar) throw new Error('Falha ao enviar foto');
            return { imagem_url: 'https://exemplo.com/upload.jpg' };
        }
        return { animais: [] };
    });
    env.executar('js/animais.js');
    await aguardar();
    env.document.querySelector('#novo-animal').click();
    const arquivo = { type: 'image/jpeg', size: 200 };
    const input = env.document.querySelector('#imagem_arquivo');
    input.files = [arquivo];
    input.dispatchEvent(new env.window.Event('change'));
    assert.equal(env.document.querySelector('#previa-imagem').getAttribute('src'), 'blob:foto-teste');
    const form = env.document.querySelector('#form-animal');
    form.elements.nome.value = 'Mel';
    form.dispatchEvent(new env.window.Event('submit', { cancelable: true }));
    await aguardar();
    assert.equal(env.document.querySelector('#cadastro').hidden, false);
    assert.equal(chamadas.some((c) => c.caminho === '/api/animais'), false);
    falhar = false;
    form.dispatchEvent(new env.window.Event('submit', { cancelable: true }));
    await aguardar();
    const upload = chamadas.find((c) => c.caminho === '/api/animais/imagem');
    assert.equal(upload.opcoes.body, arquivo);
    assert.equal(upload.opcoes.headers['Content-Type'], 'image/jpeg');
    const cadastro = chamadas.find((c) => c.caminho === '/api/animais');
    assert.equal(JSON.parse(cadastro.opcoes.body).imagem_url, 'https://exemplo.com/upload.jpg');
});

test('catálogo usa API, omite adotados, filtra e trata nomes como texto', async () => {
    const env = ambiente('index.html', async () => ({ sucesso: true, animais: [
        { id: 1, nome: '<img src=x onerror=alert(1)>', especie: 'cao', sexo: 'macho', porte: 'medio', situacao: 'disponivel' },
        { id: 2, nome: 'Mel', especie: 'gato', sexo: 'femea', porte: 'pequeno', situacao: 'disponivel' },
        { id: 3, nome: 'Já adotado', especie: 'cao', sexo: 'macho', situacao: 'adotado' }
    ] }));
    env.executar('js/main.js');
    await aguardar();
    assert.equal(env.document.querySelectorAll('.lista-animais .card-animal').length, 2);
    assert.equal(env.document.querySelector('.lista-animais h3').textContent, '<img src=x onerror=alert(1)>');
    assert.equal(env.document.querySelector('.lista-animais h3 img'), null);
    env.document.querySelector('[data-tipo="especie"][data-valor="gato"]').click();
    const visiveis = [...env.document.querySelectorAll('.lista-animais .card-animal')].filter((card) => !card.hidden);
    assert.equal(visiveis.length, 1);
    assert.equal(visiveis[0].querySelector('h3').textContent, 'Mel');
    visiveis[0].querySelector('.botao-detalhes').click();
    assert.equal(visiveis[0].querySelector('.detalhes-expandidos').hidden, false);
});

test('falha no catálogo apresenta nova tentativa, sem animais fictícios', async () => {
    const env = ambiente('index.html', async () => { throw new Error('offline'); });
    env.executar('js/main.js');
    await aguardar();
    assert.equal(env.document.querySelectorAll('.lista-animais .card-animal').length, 0);
    assert.equal(env.document.querySelector('#recarregar-catalogo').hidden, false);
});

test('cadastro envia booleanos e edição usa o ID do animal', async () => {
    const chamadas = [];
    const animal = { id: 7, nome: 'Bob', especie: 'cao', sexo: 'macho', porte: 'medio', faixa_etaria: 'adulto', situacao: 'disponivel', convivencia_criancas: true, convivencia_outros_animais: false };
    const env = ambiente('pages/animais.html', async (caminho, opcoes) => {
        chamadas.push({ caminho, opcoes });
        return { sucesso: true, animais: [animal] };
    });
    env.executar('js/animais.js');
    await aguardar();
    env.document.querySelector('#lista-admin button').click();
    const form = env.document.querySelector('#form-animal');
    form.elements.nome.value = 'Bob atualizado';
    form.elements.imagem_url.value = 'https://exemplo.com/bob.jpg';
    form.dispatchEvent(new env.window.Event('submit', { cancelable: true }));
    await aguardar();
    const envio = chamadas.find((chamada) => chamada.opcoes?.method === 'PUT');
    assert.equal(envio.caminho, '/api/animais/7');
    const body = JSON.parse(envio.opcoes.body);
    assert.equal(body.nome, 'Bob atualizado');
    assert.equal(body.imagem_url, 'https://exemplo.com/bob.jpg');
    assert.equal(body.convivencia_criancas, true);
    assert.equal(body.convivencia_outros_animais, false);
});

test('cadastro envia imagem e edição permite removê-la', async () => {
    const chamadas = [];
    const animal = { id: 9, nome: 'Mel', imagem_url: 'https://exemplo.com/mel.jpg' };
    const env = ambiente('pages/animais.html', async (caminho, opcoes) => {
        chamadas.push({ caminho, opcoes });
        return { animais: [animal] };
    });
    env.executar('js/animais.js');
    await aguardar();
    env.document.querySelector('#lista-admin button').click();
    assert.equal(env.document.querySelector('#imagem_url').value, animal.imagem_url);
    assert.equal(env.document.querySelector('#previa-imagem').hidden, false);
    env.document.querySelector('#imagem_url').value = '';
    const form = env.document.querySelector('#form-animal');
    form.dispatchEvent(new env.window.Event('submit', { cancelable: true }));
    await aguardar();
    assert.equal(JSON.parse(chamadas.find((c) => c.opcoes?.method === 'PUT').opcoes.body).imagem_url, null);
    env.document.querySelector('#novo-animal').click();
    assert.equal(env.document.querySelector('#imagem_url').value, '');
    assert.equal(env.document.querySelector('#previa-imagem').hidden, true);
    form.elements.nome.value = 'Luna';
    form.elements.imagem_url.value = 'https://exemplo.com/luna.jpg';
    form.dispatchEvent(new env.window.Event('submit', { cancelable: true }));
    await aguardar();
    assert.equal(JSON.parse(chamadas.find((c) => c.opcoes?.method === 'POST').opcoes.body).imagem_url, 'https://exemplo.com/luna.jpg');
});

test('adoção só oferece animais disponíveis e adotantes aprovados', async () => {
    const env = ambiente('pages/adocoes.html', async (caminho) => {
        if (caminho === '/api/admin/animais') return { sucesso: true, animais: [{ id: 1, nome: 'Bob', situacao: 'disponivel' }, { id: 2, nome: 'Mel', situacao: 'adotado' }] };
        if (caminho === '/api/adotantes') return { sucesso: true, adotantes: [{ id: 1, nome: 'Pessoa aprovada', status: 'aprovado' }, { id: 2, nome: 'Pessoa em triagem', status: 'em triagem' }] };
        return { sucesso: true, adocoes: [] };
    });
    env.executar('js/adocoes.js');
    await aguardar();
    assert.equal(env.document.querySelectorAll('#animal_id option').length, 2);
    assert.equal(env.document.querySelectorAll('#adotante_id option').length, 2);
    assert.equal(env.document.querySelector('#form-adocao [type=submit]').disabled, false);
});

test('histórico envia o registro para o animal selecionado', async () => {
    const chamadas = [];
    const animal = { id: 7, nome: 'Bob', situacao: 'adotado' };
    const env = ambiente('pages/animais.html', async (caminho, opcoes) => {
        chamadas.push({ caminho, opcoes });
        return { sucesso: true, animais: [animal], historico: {} };
    });
    env.executar('js/animais.js');
    await aguardar();
    env.document.querySelector('[aria-label="Histórico de Bob"]').click();
    await aguardar();
    env.document.querySelector('#registro-data_resgate').value = '2026-10-05';
    env.document.querySelector('#registro-local_resgate').value = 'Local de teste';
    env.document.querySelector('#registro-motivo').value = 'Registro de teste';
    env.document.querySelector('#form-historico').dispatchEvent(new env.window.Event('submit', { cancelable: true }));
    await aguardar();
    const envio = chamadas.find((chamada) => chamada.opcoes?.method === 'POST');
    assert.equal(envio.caminho, '/api/animais/7/resgates');
    assert.equal(JSON.parse(envio.opcoes.body).local_resgate, 'Local de teste');
    assert.equal(env.document.querySelector('#historico').hidden, false);
});

test('cadastro de interessado usa os nomes esperados pela API', async () => {
    let envio;
    const env = ambiente('pages/adocoes.html', async (caminho, opcoes) => {
        if (opcoes?.method === 'POST') envio = { caminho, opcoes };
        return { sucesso: true, animais: [], adotantes: [], adocoes: [] };
    });
    env.executar('js/adocoes.js');
    await aguardar();
    env.document.querySelector('#nome-adotante').value = 'Pessoa de teste';
    env.document.querySelector('#email-adotante').value = 'teste@example.com';
    env.document.querySelector('#telefone-adotante').value = '99999999999';
    env.document.querySelector('#form-adotante').dispatchEvent(new env.window.Event('submit', { cancelable: true }));
    await aguardar();
    assert.equal(envio.caminho, '/api/adotantes');
    const dados = JSON.parse(envio.opcoes.body);
    assert.equal(dados.nome, 'Pessoa de teste');
    assert.equal(dados.email, 'teste@example.com');
    assert.equal(dados.telefone, '99999999999');
});

test('páginas têm IDs únicos, campos rotulados e links locais existentes', () => {
    for (const pagina of ['index.html', ...fs.readdirSync('pages').filter((arquivo) => arquivo.endsWith('.html')).map((arquivo) => `pages/${arquivo}`)]) {
        const { document } = parseHTML(fs.readFileSync(pagina,'utf8'));
        const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
        assert.equal(ids.length, new Set(ids).size, `IDs duplicados em ${pagina}`);
        for (const campo of document.querySelectorAll('input:not([type=hidden]), select, textarea')) {
            assert.ok(campo.id && document.querySelector(`label[for="${campo.id}"]`), `Campo sem rótulo em ${pagina}`);
        }
        for (const el of document.querySelectorAll('[href],script[src],img[src]')) {
            const url = el.getAttribute('href') ?? el.getAttribute('src');
            if (/^(https?:|mailto:|tel:|data:)/.test(url)) continue;
            assert.notEqual(url, '#', `Link sem destino em ${pagina}`);
            const [arquivo, fragmento] = url.split('#');
            const destino = arquivo ? path.resolve(path.dirname(pagina), arquivo) : path.resolve(pagina);
            assert.ok(fs.existsSync(destino), `Destino inexistente ${url} em ${pagina}`);
            if (fragmento) {
                const docDestino = arquivo ? parseHTML(fs.readFileSync(destino, 'utf8')).document : document;
                assert.ok(docDestino.getElementById(fragmento), `Seção inexistente ${url}`);
            }
        }
    }
});
