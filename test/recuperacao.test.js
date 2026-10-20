import './setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { recuperarSenha, redefinirSenha, recuperacaoAuth } from '../src/controllers/recuperacaoController.js';
import { recuperarSchema, redefinirSchema } from '../src/schemas/recuperacaoSchemas.js';
const resposta=()=>({codigo:200,status(n){this.codigo=n;return this;},json(d){this.dados=d;return this;}});

test('rotas validam dados antes de chamar Auth e permitem recuperar sem login', async t => {
    const original = recuperacaoAuth.criarCliente;
    let chamadas = 0;
    recuperacaoAuth.criarCliente = () => ({ auth: { resetPasswordForEmail: async () => { chamadas++; return {}; } } });
    const servidor = app.listen(0, '127.0.0.1');
    await new Promise(resolve => servidor.once('listening', resolve));
    t.after(async () => { recuperacaoAuth.criarCliente = original; await new Promise(resolve => servidor.close(resolve)); });
    const base = `http://127.0.0.1:${servidor.address().port}`;
    const enviar = (rota, dados) => fetch(base + rota, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) });
    let res = await enviar('/api/recuperar-senha', { email: 'invalido' });
    assert.equal(res.status, 400); await res.text();
    res = await enviar('/api/redefinir-senha', { email: 'pessoa@example.com', codigo: 'abc123', password: 'nova-senha' });
    assert.equal(res.status, 400); await res.text();
    assert.equal(chamadas, 0);
    res = await enviar('/api/recuperar-senha', { email: 'pessoa@example.com' });
    assert.equal(res.status, 200); await res.text();
    assert.equal(chamadas, 1);
    assert.equal(recuperarSchema.parse({ email: ' Pessoa@example.com ' }).email, 'pessoa@example.com');
    assert.equal(redefinirSchema.safeParse({ email: 'pessoa@example.com', codigo: '123456', password: 'curta' }).success, false);
});

test('falha de envio ou de alteração não informa sucesso', async () => {
    const original = recuperacaoAuth.criarCliente;
    let encerrou = false;
    try {
        recuperacaoAuth.criarCliente = () => ({ auth: {
            resetPasswordForEmail: async () => ({ error: { code: 'unexpected_failure' } }),
            verifyOtp: async () => ({ data: { session: {} } }),
            updateUser: async () => ({ error: { message: 'falha' } }),
            signOut: async () => { encerrou = true; return {}; }
        } });
        let res = resposta();
        await recuperarSenha({ body: { email: 'pessoa@example.com' } }, res);
        assert.equal(res.codigo, 503);
        res = resposta();
        await redefinirSenha({ body: { email: 'pessoa@example.com', codigo: '123456', password: 'nova-senha' } }, res);
        assert.equal(res.codigo, 400);
        assert.equal(encerrou, false);
    } finally { recuperacaoAuth.criarCliente = original; }
});
test('recuperação usa resposta genérica para e-mail inexistente',async()=>{
    const original=recuperacaoAuth.criarCliente;
    try{
        recuperacaoAuth.criarCliente=()=>({auth:{resetPasswordForEmail:async()=>({error:{code:'user_not_found'}})}});
        const res=resposta();await recuperarSenha({body:{email:'inexistente@example.com'}},res);assert.equal(res.codigo,200);assert.match(res.dados.mensagem,/Se houver uma conta/);
    }finally{recuperacaoAuth.criarCliente=original;}
});

test('código inválido não altera senha; código válido encerra sessões e não retorna token',async()=>{
    const original=recuperacaoAuth.criarCliente;let verificar,atualizacoes=0,encerrou=false,invalido=true;
    try{
        recuperacaoAuth.criarCliente=()=>({auth:{verifyOtp:async d=>{verificar=d;return invalido?{error:{message:'inválido'}}:{data:{session:{access_token:'privado'}}};},updateUser:async()=>{atualizacoes++;return {};},signOut:async d=>{encerrou=d.scope==='global';return {};}}});
        const req={body:{email:'pessoa@example.com',codigo:'123456',password:'nova-senha'}};
        let res=resposta();await redefinirSenha(req,res);assert.equal(res.codigo,400);assert.equal(atualizacoes,0);
        invalido=false;res=resposta();await redefinirSenha(req,res);assert.equal(res.codigo,200);assert.equal(atualizacoes,1);assert.equal(encerrou,true);assert.equal(verificar.type,'recovery');assert.equal(res.dados.token,undefined);
    }finally{recuperacaoAuth.criarCliente=original;}
});
