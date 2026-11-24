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

test('cor no campo nome não vira "nenhum animal": a busca é refeita sem ela, com aviso', async () => {
    const gatos = [{ id: 1, nome: 'Mel', especie: 'gato', situacao: 'disponivel' }, { id: 2, nome: 'Luna', especie: 'gato', situacao: 'disponivel' }];
    const consultas = [];
    const cliente = {
        from() {
            const filtros = [];
            consultas.push(filtros);
            const consulta = {
                select() { return this; },
                limit() { return this; },
                eq(campo, valor) { filtros.push([campo, valor]); return this; },
                ilike(campo, valor) { filtros.push([campo, valor]); return this; },
                then(resolve, reject) {
                    const porNome = filtros.some(([campo]) => campo === 'nome');
                    return Promise.resolve({ data: porNome ? [] : gatos, error: null }).then(resolve, reject);
                }
            };
            return consulta;
        }
    };
    const resultado = await executarFerramenta('buscar_animais', { especie: 'gato', nome: 'preto' }, cliente);
    assert.equal(resultado.total, 2);
    assert.match(resultado.aviso, /não registra cor/);
    assert.deepEqual(consultas[1], [['situacao', 'disponivel'], ['especie', 'gato']]);
});

test('nome real sem resultado continua sem resultado e sem aviso', async () => {
    const cliente = clienteFalso([]);
    const resultado = await executarFerramenta('buscar_animais', { nome: 'Rex' }, cliente);
    assert.equal(resultado.total, 0);
    assert.equal(resultado.aviso, undefined);
});
