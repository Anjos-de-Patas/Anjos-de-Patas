import './setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { listarResgates, registrarResgate } from '../src/controllers/historicoController.js';
import { resgateSchema } from '../src/schemas/validationSchemas.js';

const resposta = () => ({ codigo: 200, status(n) { this.codigo = n; return this; }, json(dados) { this.dados = dados; return this; } });

test('resgates exigem sessão para consulta e registro', async t => {
    const servidor = app.listen(0, '127.0.0.1');
    await new Promise(resolve => servidor.once('listening', resolve));
    t.after(() => new Promise(resolve => servidor.close(resolve)));
    const base = `http://127.0.0.1:${servidor.address().port}`;
    for (const [method, rota] of [['GET', '/api/resgates'], ['POST', '/api/animais/7/resgates']]) {
        const res = await fetch(base + rota, { method });
        assert.equal(res.status, 401);
        await res.text();
    }
});

test('resgate rejeita datas impossíveis ou futuras', () => {
    const dados = { data_resgate: '2026-01-01', local_resgate: 'Centro', motivo: 'Animal encontrado' };
    assert.equal(resgateSchema.safeParse(dados).success, true);
    for (const data_resgate of ['2026-02-30', '2099-01-01', '01/01/2026', '']) {
        assert.equal(resgateSchema.safeParse({ ...dados, data_resgate }).success, false);
    }
});

test('listagem usa o cliente da equipe e oculta erros internos', async () => {
    let ordenacao;
    const req = { supabase: { from(tabela) {
        assert.equal(tabela, 'resgates');
        return { select() { return this; }, async order(...args) { ordenacao = args; return { data: [{ animal_id: 7 }], error: null }; } };
    } } };
    const res = resposta();
    await listarResgates(req, res);
    assert.deepEqual(ordenacao, ['data_resgate', { ascending: false }]);
    assert.deepEqual(res.dados.resgates, [{ animal_id: 7 }]);
    const falha = resposta();
    await listarResgates({ supabase: { from() { throw new Error('segredo interno'); } } }, falha);
    assert.equal(falha.codigo, 500);
    assert.equal(JSON.stringify(falha.dados).includes('segredo interno'), false);
});

test('registro vincula o animal da rota e não grava se ele não existir', async () => {
    let existe = true, registro;
    const req = { params: { id: '7' }, body: { data_resgate: '2026-01-01', local_resgate: 'Centro', motivo: 'Animal encontrado' }, supabase: {
        from(tabela) {
            if (tabela === 'animais') return { select() { return this; }, eq() { return this; }, async maybeSingle() { return { data: existe ? { id: 7 } : null, error: null }; } };
            return { insert(dados) { registro = dados[0]; return this; }, select() { return this; }, async single() { return { data: registro, error: null }; } };
        }
    } };
    let res = resposta();
    await registrarResgate(req, res);
    assert.equal(res.codigo, 201);
    assert.equal(registro.animal_id, '7');
    existe = false; registro = null; res = resposta();
    await registrarResgate(req, res);
    assert.equal(res.codigo, 404);
    assert.equal(registro, null);
});
