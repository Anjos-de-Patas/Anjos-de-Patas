// PostgreSQL WebAssembly isolado. Não conecta ao Supabase nem lê o .env.
// Instale @electric-sql/pglite@0.5.8 com --no-save para executar separadamente.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
let verificacoes = 0;
async function confere(nome, fn) { await fn(); verificacoes++; console.log(`OK ${nome}`); }
const escalar = async sql => Object.values((await db.query(sql)).rows[0])[0];
const arquivo = nome => fs.readFileSync(new URL(`../${nome}`, import.meta.url), 'utf8');
const idEquipe = '00000000-0000-0000-0000-000000000001';
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; grant usage on schema auth to authenticated;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
    create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
  for (const caminho of ['docs/database/01-schema.sql',
    'docs/migrations/20261005_imagem_animal.sql', 'docs/migrations/20261005_upload_animal.sql',
    'docs/migrations/20261009_interesse_adocao.sql', 'docs/migrations/20261009_gestao_interessados.sql',
    'docs/database/02-adocao-atomica.sql']) {
    await db.exec(arquivo(caminho));
  }
  await confere('schema e scripts incrementais com RLS em todas as tabelas públicas', async () => {
    assert.equal(await escalar("select count(*)::int from pg_tables where schemaname='public' and not rowsecurity"), 0);
    assert.equal(await escalar("select count(*)::int from pg_tables where schemaname='public'"), 9);
  });
  await db.exec(`insert into auth.users values ('${idEquipe}');
    insert into perfis(id,nome,perfil) values ('${idEquipe}','Equipe Teste','voluntario');
    insert into animais(nome,especie,sexo,porte,faixa_etaria,convivencia_criancas,convivencia_outros_animais,situacao)
      values ('Mel','cao','femea','medio','adulto',true,true,'disponivel'),
      ('Bob','cao','macho','medio','adulto',true,true,'em tratamento');
    insert into adotantes(nome,email,telefone,status,etapa) values
      ('Pessoa Aprovada','aprovada@example.com','99999999999','aprovado','aprovado'),
      ('Pessoa Triagem','triagem@example.com','99999999999','em triagem','recebido');`);
  await confere('catálogo anônimo só vê disponíveis; contatos e perfis ficam privados', async () => {
    await db.exec('set role anon');
    assert.equal(await escalar('select count(*)::int from animais'), 1);
    for (const tabela of ['adotantes','perfis','adocoes','acompanhamento_eventos']) {
      await assert.rejects(db.query(`select * from ${tabela}`), e => e.code === '42501');
    }
    await assert.rejects(db.query("select registrar_adocao('1','1','2026-10-26',null)"), e => e.code === '42501');
    await db.exec('reset role');
  });
  await confere('conta autenticada sem perfil não acessa dados da equipe', async () => {
    await db.exec("set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000099'");
    assert.equal(await escalar('select count(*)::int from adotantes'), 0);
    await assert.rejects(db.query("select registrar_adocao('1','1','2026-10-26',null)"), e => e.code === 'P0002');
    await db.exec('reset role');
  });
  await db.exec(`set role authenticated; set request.jwt.claim.sub='${idEquipe}'`);
  await confere('equipe consulta perfil próprio e não promove a si mesma', async () => {
    assert.equal(await escalar('select count(*)::int from perfis'), 1);
    await assert.rejects(db.query("update perfis set perfil='admin'"), e => e.code === '42501');
    await db.query("update perfis set nome='Nome atualizado'");
  });
  await confere('adoção rejeita animal em tratamento e adotante não aprovado', async () => {
    await assert.rejects(db.query("select registrar_adocao('2','1','2026-10-26',null)"), e => e.code === 'P0001');
    await assert.rejects(db.query("select registrar_adocao('1','2','2026-10-26',null)"), e => e.code === '22023');
    assert.equal(await escalar('select count(*)::int from adocoes'), 0);
  });
  await confere('adoção e conclusão do acompanhamento fazem rollback juntas', async () => {
    await assert.rejects(db.query("select registrar_adocao('1','1',null,null)"), e => e.code === '23502');
    assert.equal(await escalar("select situacao from animais where id=1"), 'disponivel');
    assert.equal(await escalar('select count(*)::int from adocoes'), 0);
    assert.equal(await escalar('select etapa from adotantes where id=1'), 'aprovado');
  });
  await confere('adoção válida atualiza animal, etapa e auditoria em uma transação', async () => {
    const r = await db.query("select registrar_adocao('1','1','2026-10-26',null) as resultado");
    assert.equal(r.rows[0].resultado.animal.situacao, 'adotado');
    assert.equal(await escalar('select etapa from adotantes where id=1'), 'concluida');
    await assert.rejects(db.query("select registrar_adocao('1','1','2026-10-26',null)"), e => e.code === 'P0001');
    assert.equal(await escalar('select count(*)::int from adocoes'), 1);
    await db.exec('reset role');
    assert.equal(await escalar("select count(*)::int from acompanhamento_eventos where adotante_id='1' and etapa='concluida'"), 1);
  });
  await confere('conflito de versão e conclusão sem adoção não alteram cadastro', async () => {
    await db.query("select registrar_acompanhamento('2',0,'entrevista','contato','Contato de teste', $1)", [idEquipe]);
    await assert.rejects(db.query("select registrar_acompanhamento('2',0,'triagem','nota','Outra edição',null)"), e => e.code === '40001');
    await assert.rejects(db.query("select registrar_acompanhamento('2',1,'concluida','nota','Sem adoção',null)"), e => e.code === 'P0001');
    assert.equal(await escalar('select etapa from adotantes where id=2'), 'entrevista');
  });
  await confere('perfil inativo perde o acesso aos registros', async () => {
    await db.exec(`update perfis set ativo=false; set role authenticated; set request.jwt.claim.sub='${idEquipe}'`);
    assert.equal(await escalar('select count(*)::int from adotantes'), 0);
    await db.exec('reset role');
  });
  console.log(`Resultado: ${verificacoes} grupos de verificações SQL aprovados. Banco descartado ao encerrar.`);
} finally { await db.close(); }
