import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '../config/database.js';

const tipos = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function imagemValida(buffer, tipo) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) return false;
  if (tipo === 'image/jpeg') return buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
  if (tipo === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (tipo === 'image/webp') return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

export async function enviarImagemAnimal(req, res, next) {
  const tipo = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (!tipos[tipo] || !imagemValida(req.body, tipo)) {
    return res.status(400).json({ sucesso: false, erro: 'Selecione uma imagem válida em JPG, PNG ou WebP.' });
  }
  if (req.body.length > 5 * 1024 * 1024) {
    return res.status(413).json({ sucesso: false, erro: 'A foto deve ter no máximo 5 MB.' });
  }
  try {
    const caminho = `${req.user.id}/${randomUUID()}.${tipos[tipo]}`;
    const bucket = supabaseAdmin.storage.from('animais-imagens');
    const opcoes = { contentType: tipo, upsert: false };
    let { error } = await bucket.upload(caminho, req.body, opcoes);
    if (error && (error.code === 'NoSuchBucket' || /bucket not found/i.test(error.message || ''))) {
      const { error: erroCriacao } = await supabaseAdmin.storage.createBucket('animais-imagens', {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: Object.keys(tipos)
      });
      // Outra requisição pode ter criado o bucket ao mesmo tempo.
      if (erroCriacao && !['409', 'Duplicate'].includes(String(erroCriacao.statusCode || erroCriacao.code)) && !/already exists/i.test(erroCriacao.message || '')) throw erroCriacao;
      ({ error } = await bucket.upload(caminho, req.body, opcoes));
    }
    if (error) throw error;
    const { data } = bucket.getPublicUrl(caminho);
    return res.status(201).json({ sucesso: true, imagem_url: data.publicUrl });
  } catch (erro) { next(erro); }
}
