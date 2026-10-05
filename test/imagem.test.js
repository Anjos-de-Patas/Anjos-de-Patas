import './setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { enviarImagemAnimal } from '../src/controllers/imagemController.js';
import { supabaseAdmin } from '../src/config/database.js';

test('bucket ausente é criado e o upload é repetido; falhas de permissão não criam bucket', async () => {
  const originalFrom = supabaseAdmin.storage.from;
  const originalCreate = supabaseAdmin.storage.createBucket;
  let uploads = 0;
  let criacoes = 0;
  let erroUpload = { message: 'Bucket not found', statusCode: '404' };
  supabaseAdmin.storage.from = () => ({
    async upload() { uploads++; return { error: uploads === 1 ? erroUpload : null }; },
    getPublicUrl() { return { data: { publicUrl: 'https://example.com/foto.jpg' } }; }
  });
  supabaseAdmin.storage.createBucket = async (nome, opcoes) => {
    criacoes++;
    assert.equal(nome, 'animais-imagens');
    assert.equal(opcoes.public, true);
    assert.equal(opcoes.fileSizeLimit, 5242880);
    assert.deepEqual(opcoes.allowedMimeTypes, ['image/jpeg', 'image/png', 'image/webp']);
    return { error: null };
  };
  try {
    const req = { headers: { 'content-type': 'image/jpeg' }, user: { id: 'usuario' }, body: Buffer.from([255, 216, 255, 0]) };
    const res = { status(valor) { this.codigo = valor; return this; }, json(valor) { this.dados = valor; return this; } };
    await enviarImagemAnimal(req, res, (erro) => { throw erro; });
    assert.equal(res.codigo, 201);
    assert.equal(uploads, 2);
    assert.equal(criacoes, 1);
    uploads = 0;
    erroUpload = { message: 'Access denied', statusCode: '403' };
    let recebido;
    await enviarImagemAnimal(req, res, (erro) => { recebido = erro; });
    assert.equal(recebido, erroUpload);
    assert.equal(uploads, 1);
    assert.equal(criacoes, 1);
  } finally {
    supabaseAdmin.storage.from = originalFrom;
    supabaseAdmin.storage.createBucket = originalCreate;
  }
});

test('upload valida conteúdo e tamanho antes de acessar Storage e retorna URL pública', async () => {
  const original = supabaseAdmin.storage.from;
  const chamadas = [];
  supabaseAdmin.storage.from = (bucket) => ({
    async upload(caminho, buffer, opcoes) { chamadas.push({ bucket, caminho, buffer, opcoes }); return { error: null }; },
    getPublicUrl(caminho) { return { data: { publicUrl: `https://example.com/${caminho}` } }; }
  });
  try {
    const res = { status(valor) { this.codigo = valor; return this; }, json(valor) { this.dados = valor; return this; } };
    const req = { headers: { 'content-type': 'image/jpeg' }, user: { id: 'usuario' }, body: Buffer.from('arquivo falso') };
    const next = (erro) => { throw erro; };
    await enviarImagemAnimal(req, res, next);
    assert.equal(res.codigo, 400);
    assert.equal(chamadas.length, 0);
    req.body = Buffer.alloc(5 * 1024 * 1024 + 1);
    Buffer.from([255, 216, 255]).copy(req.body);
    await enviarImagemAnimal(req, res, next);
    assert.equal(res.codigo, 413);
    assert.equal(chamadas.length, 0);
    req.body = Buffer.from([255, 216, 255, 0]);
    await enviarImagemAnimal(req, res, next);
    assert.equal(res.codigo, 201);
    assert.equal(chamadas[0].bucket, 'animais-imagens');
    assert.match(chamadas[0].caminho, /^usuario\/.+\.jpg$/);
    assert.equal(chamadas[0].opcoes.contentType, 'image/jpeg');
    assert.match(res.dados.imagem_url, /^https:\/\//);
  } finally { supabaseAdmin.storage.from = original; }
});
