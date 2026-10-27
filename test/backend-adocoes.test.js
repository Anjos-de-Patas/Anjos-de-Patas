import './setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { registrarAdocao } from '../src/controllers/historicoController.js';
import { cadastrarAdotante } from '../src/controllers/adotanteController.js';
import { atualizarPerfil } from '../src/controllers/perfilController.js';
import { adocaoSchema, vacinaSchema, tratamentoSchema } from '../src/schemas/validationSchemas.js';

const resposta = () => ({ statusCode: 200, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; } });

test('adoção usa uma transação e mantém o contrato da interface', async () => {
  let chamada;
  const resultado = { adocao: { id: 7 }, animal: { id: 1, situacao: 'adotado' } };
  const req = { body: { animal_id: 1, adotante_id: 2, data_adocao: '2026-10-26' },
    supabase: { async rpc(nome, parametros) { chamada = { nome, parametros }; return { data: resultado }; } } };
  const res = resposta();
  await registrarAdocao(req, res);
  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, { sucesso: true, ...resultado });
  assert.deepEqual(chamada, { nome: 'registrar_adocao', parametros: {
    p_animal_id: '1', p_adotante_id: '2', p_data: '2026-10-26', p_observacoes: null
  } });
});

test('adoção comunica conflitos e falhas sem expor detalhes internos', async () => {
  for (const [code, esperado] of [['P0002',404], ['P0001',409], ['23505',409], ['22023',400], ['42501',403], ['desconhecido',500]]) {
    const res = resposta();
    await registrarAdocao({ body: {}, supabase: { async rpc() { return { error: { code, message: 'segredo interno' } }; } } }, res);
    assert.equal(res.statusCode, esperado);
    assert.ok(!JSON.stringify(res.body).includes('segredo interno'));
  }
});

test('datas rejeitam dias inexistentes e períodos invertidos', () => {
  for (const data_adocao of ['2026-02-30', '2026-13-01', '26/10/2026', 'qualquer texto']) {
    assert.equal(adocaoSchema.safeParse({ animal_id: 1, adotante_id: 2, data_adocao }).success, false);
  }
  assert.equal(adocaoSchema.safeParse({ animal_id: 1, adotante_id: 2, data_adocao: '2024-02-29' }).success, true);
  assert.equal(vacinaSchema.safeParse({ nome: 'Vacina', data_aplicacao: '2026-10-26', proxima_dose: '2026-10-25' }).success, false);
  assert.equal(tratamentoSchema.safeParse({ descricao: 'Tratamento', inicio: '2026-10-26', fim: '2026-10-25' }).success, false);
  assert.equal(vacinaSchema.safeParse({ nome: 'Vacina', data_aplicacao: '2026-10-26', proxima_dose: '' }).success, true);
});

test('cadastro administrativo grava com o cliente autenticado da requisição', async () => {
  let registro;
  const res = resposta();
  await cadastrarAdotante({ body: { nome: 'Pessoa Teste', email: 'teste@example.com', telefone: '99999999999' },
    supabase: { from(tabela) { assert.equal(tabela, 'adotantes'); return {
      insert(dados) { registro = dados[0]; return this; }, async select() { return { data: [{ id: 1, ...registro }] }; }
    }; } } }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(registro.status, 'em triagem');
});

test('edição do perfil usa o usuário validado e só atualiza nome e data', async () => {
  let alteracoes;
  const res = resposta();
  await atualizarPerfil({ body: { nome: ' Nome Teste ', perfil: 'admin' }, user: { id: 'usuario-validado', email: 'teste@example.com' },
    supabase: { from() { return {
      update(dados) { alteracoes = dados; return this; },
      eq(campo, valor) { assert.deepEqual([campo, valor], ['id', 'usuario-validado']); return this; },
      select() { return this; }, async single() { return { data: { id: 'usuario-validado', nome: 'Nome Teste', perfil: 'voluntario' } }; }
    }; } } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(alteracoes.nome, 'Nome Teste');
  assert.deepEqual(Object.keys(alteracoes).sort(), ['atualizado_em', 'nome']);
});
