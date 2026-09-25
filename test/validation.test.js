import test from 'node:test';
import assert from 'node:assert/strict';
import {
  animalSchema,
  animalUpdateSchema,
  adocaoSchema,
  buscaSchema
} from '../src/schemas/validationSchemas.js';

const animalValido = {
  nome: 'Mel',
  especie: 'cao',
  sexo: 'femea',
  porte: 'medio',
  faixa_etaria: 'adulto',
  convivencia_criancas: true,
  convivencia_outros_animais: true,
  situacao: 'disponivel'
};

test('animalSchema aceita um animal valido', () => {
  const resultado = animalSchema.safeParse(animalValido);
  assert.equal(resultado.success, true);
});

test('animalSchema rejeita situacao desconhecida', () => {
  const resultado = animalSchema.safeParse({ ...animalValido, situacao: 'reservado' });
  assert.equal(resultado.success, false);
});

test('animalUpdateSchema permite atualizacao parcial', () => {
  const resultado = animalUpdateSchema.safeParse({ situacao: 'adotado' });
  assert.equal(resultado.success, true);
});

test('buscaSchema limita texto vazio e texto muito grande', () => {
  assert.equal(buscaSchema.safeParse({ texto: '' }).success, false);
  assert.equal(buscaSchema.safeParse({ texto: 'a'.repeat(501) }).success, false);
});

test('adocaoSchema exige animal, adotante e data', () => {
  assert.equal(adocaoSchema.safeParse({ animal_id: 1, adotante_id: 2, data_adocao: '2026-09-25' }).success, true);
  assert.equal(adocaoSchema.safeParse({ animal_id: 1 }).success, false);
});
