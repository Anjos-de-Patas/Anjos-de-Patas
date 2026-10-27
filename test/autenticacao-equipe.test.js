import './setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { login, autenticacaoEquipe } from '../src/controllers/authController.js';
import { verificarToken, clientesAutenticacao } from '../src/middlewares/authMiddleware.js';

const resposta = () => ({ codigo: 200, status(n) { this.codigo = n; return this; }, json(dados) { this.dados = dados; return this; } });

test('cada login usa um cliente isolado e consulta o perfil da própria sessão', async () => {
    const original = autenticacaoEquipe.criarCliente;
    const clientes = [];
    try {
        autenticacaoEquipe.criarCliente = () => {
            let email;
            const cliente = {
                auth: { async signInWithPassword(dados) { email = dados.email; return { data: { user: { id: email, email }, session: { access_token: `token-${email}` } }, error: null }; } },
                from() { return { select() { return this; }, eq(campo, id) { assert.equal(id, email); return this; }, async single() { return { data: { nome: email, perfil: 'voluntario', ativo: true }, error: null }; } }; }
            };
            clientes.push(cliente);
            return cliente;
        };
        const a = resposta(), b = resposta();
        await Promise.all([login({ body: { email: 'a@example.com', password: 'teste' } }, a), login({ body: { email: 'b@example.com', password: 'teste' } }, b)]);
        assert.equal(clientes.length, 2);
        assert.notEqual(clientes[0], clientes[1]);
        assert.equal(a.dados.usuario.email, 'a@example.com');
        assert.equal(b.dados.usuario.email, 'b@example.com');
    } finally { autenticacaoEquipe.criarCliente = original; }
});

test('middleware consulta perfil pelo cliente autenticado e bloqueia perfil inativo', async () => {
    const original = clientesAutenticacao.criarCliente;
    let ativo = true, avancou = false, cliente;
    try {
        clientesAutenticacao.criarCliente = (url, chave, opcoes) => {
            assert.equal(opcoes.global.headers.Authorization, 'Bearer teste');
            cliente = { auth: { async getUser() { return { data: { user: { id: 'usuario-validado' } }, error: null }; } },
                from(tabela) { assert.equal(tabela, 'perfis'); return { select() { return this; }, eq(campo, valor) { assert.equal(valor, 'usuario-validado'); return this; }, async single() { return { data: { perfil: 'voluntario', ativo }, error: null }; } }; }
            };
            return cliente;
        };
        const req = { headers: { authorization: 'Bearer teste' } };
        await verificarToken(req, resposta(), () => { avancou = true; });
        assert.equal(avancou, true);
        assert.equal(req.supabase, cliente);
        ativo = false; avancou = false;
        const res = resposta();
        await verificarToken({ headers: req.headers }, res, () => { avancou = true; });
        assert.equal(res.codigo, 403);
        assert.equal(avancou, false);
    } finally { clientesAutenticacao.criarCliente = original; }
});
