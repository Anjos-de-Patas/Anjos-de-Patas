import './setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';
import app from '../src/app.js';
import { supabaseAdmin } from '../src/config/database.js';
import { obterResultadosPublicos } from '../src/controllers/publicoController.js';

test('indicadores públicos consultam somente contagens, preservam zero e não expõem registros', async t => {
    const original = supabaseAdmin.from;
    const chamadas = [];
    supabaseAdmin.from = tabela => ({
        select(campos, opcoes) { chamadas.push({ tabela, campos, opcoes }); return this; },
        neq(campo, valor) { chamadas.push({ campo, valor, filtro: 'neq' }); return this; },
        eq(campo, valor) { chamadas.push({ campo, valor, filtro: 'eq' }); return this; },
        then(resolve, reject) { return Promise.resolve({ count: 0, data: [{ email: 'privado@example.com' }] }).then(resolve, reject); }
    });
    const servidor = app.listen(0, '127.0.0.1');
    await new Promise(r => servidor.once('listening', r));
    t.after(async () => { supabaseAdmin.from = original; await new Promise(r => servidor.close(r)); });
    const resposta = await fetch(`http://127.0.0.1:${servidor.address().port}/api/resultados`);
    assert.equal(resposta.status, 200);
    const dados = await resposta.json();
    assert.deepEqual(dados.dados, { animais_acolhidos: 0, disponiveis: 0, adocoes_registradas: 0 });
    assert.ok(Number.isFinite(Date.parse(dados.atualizado_em)));
    assert.equal(JSON.stringify(dados).includes('privado@example.com'), false);
    assert.equal(chamadas.filter(c => c.opcoes?.head && c.opcoes.count === 'exact').length, 3);
    assert.ok(chamadas.some(c => c.filtro === 'neq' && c.valor === 'adotado'));
    assert.ok(chamadas.some(c => c.filtro === 'eq' && c.valor === 'disponivel'));
});

test('falhas ou contagens inválidas não publicam valores parciais nem detalhes internos', async () => {
    const original = supabaseAdmin.from;
    try {
        for (const resultado of [{ error: { message: 'segredo' }, count: null }, { count: null }, { count: undefined }, { count: -1 }]) {
            supabaseAdmin.from = () => ({ select() { return this; }, neq() { return this; }, eq() { return this; }, then(resolve) { return Promise.resolve(resultado).then(resolve); } });
            const res = { status(n) { this.codigo=n; return this; }, json(d) { this.dados=d; } };
            await obterResultadosPublicos({}, res);
            assert.equal(res.codigo, 503);
            assert.equal(res.dados.dados, undefined);
            assert.equal(JSON.stringify(res.dados).includes('segredo'), false);
        }
        supabaseAdmin.from = () => { throw new Error('segredo'); };
        const res = { status(n) { this.codigo=n; return this; }, json(d) { this.dados=d; } };
        await obterResultadosPublicos({}, res);
        assert.equal(res.codigo, 503);
    } finally { supabaseAdmin.from = original; }
});

test('transparência oculta indicadores em falha e permite nova consulta com valores zero', async () => {
    const { document, window } = parseHTML(fs.readFileSync('pages/transparencia.html', 'utf8'));
    let falhar = true;
    const context = vm.createContext({ document, window: { AnjosAPI: { async solicitar() {
        if (falhar) throw new Error('indisponível');
        return { dados: { animais_acolhidos: 0, disponiveis: 0, adocoes_registradas: 0 }, atualizado_em: '2026-10-27T12:00:00Z' };
    } } } });
    vm.runInContext(fs.readFileSync('js/transparencia.js', 'utf8'), context);
    await new Promise(setImmediate);
    assert.equal(document.querySelector('#indicadores').hidden, true);
    assert.equal(document.querySelector('#recarregar-resultados').hidden, false);
    falhar = false;
    document.querySelector('#recarregar-resultados').dispatchEvent(new window.Event('click'));
    await new Promise(setImmediate);
    assert.equal(document.querySelector('#indicadores').hidden, false);
    assert.equal(document.querySelector('#total-acolhidos').textContent, '0');
    assert.match(document.querySelector('#atualizacao-resultados').textContent, /Brasília/);
    assert.equal(document.querySelector('#recarregar-resultados').hidden, true);
    falhar = true;
    await vm.runInContext('carregarResultados()', context);
    assert.equal(document.querySelector('#indicadores').hidden, true);
    assert.equal(document.querySelector('#atualizacao-resultados').textContent, '');
});
