import './setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { supabaseAdmin } from '../src/config/database.js';
import { listarInteressados, historicoInteressado, atualizarAcompanhamento } from '../src/controllers/interessadosController.js';
import { acompanhamentoSchema } from '../src/schemas/interessadosSchemas.js';
const resposta=()=>({codigo:200,status(n){this.codigo=n;return this;},json(d){this.dados=d;return this;}});

test('rotas de acompanhamento rejeitam visitantes sem sessão', async t => {
    const servidor = app.listen(0, '127.0.0.1');
    await new Promise(resolve => servidor.once('listening', resolve));
    t.after(() => new Promise(resolve => servidor.close(resolve)));
    const base = `http://127.0.0.1:${servidor.address().port}`;
    for (const [method, rota] of [['GET', '/api/admin/interessados'], ['GET', '/api/admin/interessados/1/historico'], ['POST', '/api/admin/interessados/1/acompanhamento']]) {
        const res = await fetch(base + rota, { method });
        assert.equal(res.status, 401);
        await res.text();
    }
});

test('listagem combina pesquisa e etapa com paginação de vinte registros', async () => {
    const original = supabaseAdmin.from;
    const chamadas = [];
    try {
        supabaseAdmin.from = () => {
            const q = {};
            for (const metodo of ['select', 'eq', 'or', 'order']) q[metodo] = (...args) => { chamadas.push([metodo, ...args]); return q; };
            q.range = async (...args) => { chamadas.push(['range', ...args]); return { data: [], count: 0, error: null }; };
            return q;
        };
        const res = resposta();
        await listarInteressados({ query: { pagina: '2', busca: 'Mel', etapa: 'triagem' } }, res);
        assert.deepEqual(chamadas.find(c => c[0] === 'range'), ['range', 20, 39]);
        assert.deepEqual(chamadas.find(c => c[0] === 'eq'), ['eq', 'etapa', 'triagem']);
        assert.match(chamadas.find(c => c[0] === 'or')[1], /animal_nome/);
        assert.equal(res.dados.total, 0);
        const invalida = resposta();
        await listarInteressados({ query: { etapa: 'inexistente' } }, invalida);
        assert.equal(invalida.codigo, 400);
    } finally { supabaseAdmin.from = original; }
});

test('validação exige versão e limita notas e etapas sem aceitar autor do navegador', () => {
    assert.equal(acompanhamentoSchema.safeParse({ versao: 1, etapa: 'entrevista' }).success, true);
    for (const dados of [{ nota: 'Contato' }, { versao: 1, nota: '' }, { versao: 1, nota: 'a'.repeat(3001) }, { versao: 1, etapa: 'inexistente' }, { versao: 1, nota: 'Contato', autor_id: 'outro' }]) {
        assert.equal(acompanhamentoSchema.safeParse(dados).success, false);
    }
});

test('histórico limita eventos e rejeita identificador inválido antes da consulta', async () => {
    const original = supabaseAdmin.from;
    let limite, filtro;
    try {
        supabaseAdmin.from = () => ({ select() { return this; }, eq(...args) { filtro = args; return this; }, order() { return this; }, async limit(n) { limite = n; return { data: [], error: null }; } });
        const res = resposta();
        await historicoInteressado({ params: { id: '7' } }, res);
        assert.deepEqual(filtro, ['adotante_id', '7']);
        assert.equal(limite, 100);
        const invalido = resposta();
        await historicoInteressado({ params: { id: '<script>' } }, invalido);
        assert.equal(invalido.codigo, 400);
    } finally { supabaseAdmin.from = original; }
});
test('acompanhamento envia autor validado e versão à transação; conflito exige recarga',async()=>{
    const original=supabaseAdmin.rpc;let chamada;
    try{
        supabaseAdmin.rpc=async(nome,args)=>{chamada={nome,args};return {error:{code:'40001'}};};
        const res=resposta();await atualizarAcompanhamento({params:{id:'3'},user:{id:'operador-validado'},body:{etapa:'entrevista',tipo:'contato',nota:'Contato realizado',versao:2}},res);
        assert.equal(chamada.nome,'registrar_acompanhamento');assert.equal(chamada.args.p_autor,'operador-validado');assert.equal(chamada.args.p_versao,2);assert.equal(res.codigo,409);
    }finally{supabaseAdmin.rpc=original;}
});
