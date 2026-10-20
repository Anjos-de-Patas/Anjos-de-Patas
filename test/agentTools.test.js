import './setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { executarFerramenta } from '../src/services/agentTools.js';

function clienteFalso(animais) {
    const filtros = [];
    const consulta = {
        select() { return this; },
        limit() { return this; },
        eq(campo, valor) { filtros.push([campo, valor]); return this; },
        ilike(campo, valor) { filtros.push([campo, valor]); return this; },
        then(resolve, reject) {
            return Promise.resolve({ data: animais, error: null }).then(resolve, reject);
        }
    };
    return { filtros, from() { return consulta; } };
}

test('detalhes por nome não enviam Bob para a coluna id', async () => {
    const cliente = clienteFalso([{ id: 1, nome: 'Bob' }]);
    const resultado = await executarFerramenta('obter_detalhes_animal', { nome: 'Bob' }, cliente);
    assert.equal(resultado.animal.nome, 'Bob');
    assert.deepEqual(cliente.filtros, [['situacao', 'disponivel'], ['nome', 'Bob']]);
});

test('nome usado como id é rejeitado antes da consulta', async () => {
    const cliente = clienteFalso([]);
    const resultado = await executarFerramenta('obter_detalhes_animal', { animal_id: 'bob' }, cliente);
    assert.equal(resultado.sucesso, false);
    assert.deepEqual(cliente.filtros, []);
});

test('detalhes aceitam id numérico e não escolhem entre nomes duplicados', async () => {
    const cliente = clienteFalso([{ id: 1, nome: 'Bob' }]);
    const resultado = await executarFerramenta('obter_detalhes_animal', { animal_id: '1' }, cliente);
    assert.equal(resultado.animal.id, 1);
    assert.deepEqual(cliente.filtros, [['situacao', 'disponivel'], ['id', '1']]);
    const duplicados = clienteFalso([{ id: 1, nome: 'Bob' }, { id: 2, nome: 'Bob' }]);
    const ambiguo = await executarFerramenta('obter_detalhes_animal', { nome: 'Bob' }, duplicados);
    assert.equal(ambiguo.sucesso, false);
    assert.equal(ambiguo.animais.length, 2);
});
