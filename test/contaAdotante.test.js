import './setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { supabaseAdmin } from '../src/config/database.js';
import { cadastroContaAdotanteSchema } from '../src/schemas/validationSchemas.js';
import { verificarContaAdotante, obterContaAdotante } from '../src/controllers/contaAdotanteController.js';
import { contaAdotanteAuth, cadastrarContaAdotante, entrarContaAdotante } from '../src/controllers/contaAdotanteController.js';
import app from '../src/app.js';
const consultarPerfilEquipeOriginal = contaAdotanteAuth.consultarPerfilEquipe;
test.beforeEach(() => { contaAdotanteAuth.consultarPerfilEquipe = async () => ({ data: null, error: null }); });
test.afterEach(() => { contaAdotanteAuth.consultarPerfilEquipe = consultarPerfilEquipeOriginal; });
const resposta = () => ({ codigo: 200, status(n) {this.codigo=n;return this;},json(dados){this.dados=dados;return this;} });

test('conta da equipe não recebe token de adotante e encerra somente o novo login', async () => {
    const original = contaAdotanteAuth.criarCliente;
    let escopo;
    try {
        contaAdotanteAuth.criarCliente = () => ({ auth: {
            signInWithPassword: async () => ({ data: { user: { id: 'equipe', email_confirmed_at: '2026-01-01' }, session: { access_token: 'nao-publicar' } }, error: null }),
            signOut: async ({ scope }) => { escopo = scope; }
        } });
        contaAdotanteAuth.consultarPerfilEquipe = async id => { assert.equal(id, 'equipe'); return { data: { id }, error: null }; };
        const res = resposta(); await entrarContaAdotante({ body: {} }, res);
        assert.equal(res.codigo, 403); assert.equal(res.dados.token, undefined);
        assert.match(res.dados.erro, /administrativa/); assert.equal(escopo, 'local');
    } finally { contaAdotanteAuth.criarCliente = original; }
});

test('token existente da equipe é bloqueado e falha na verificação não libera acesso', async () => {
    const original = supabaseAdmin.auth.getUser;
    try {
        supabaseAdmin.auth.getUser = async () => ({ data: { user: { id: 'equipe', email: 'equipe@example.com', email_confirmed_at: '2026-01-01' } }, error: null });
        let avancou = false;
        contaAdotanteAuth.consultarPerfilEquipe = async () => ({ data: { id: 'equipe' }, error: null });
        const negado = resposta(); await verificarContaAdotante({ headers: { authorization: 'Bearer existente' } }, negado, () => { avancou = true; });
        assert.equal(negado.codigo, 403); assert.equal(avancou, false);
        contaAdotanteAuth.consultarPerfilEquipe = async () => ({ data: null, error: new Error('Banco indisponivel') });
        const indisponivel = resposta(); await verificarContaAdotante({ headers: { authorization: 'Bearer existente' } }, indisponivel, () => { avancou = true; });
        assert.equal(indisponivel.codigo, 503); assert.equal(avancou, false);
        assert.doesNotMatch(JSON.stringify(indisponivel.dados), /Banco indisponivel/);
    } finally { supabaseAdmin.auth.getUser = original; }
});

test('cadastro envia somente nome ao Auth e login exige confirmação do e-mail', async () => {
    const original = contaAdotanteAuth.criarCliente;
    let cadastro, confirmado = false;
    try {
        contaAdotanteAuth.criarCliente = () => ({ auth: {
            signUp: async dados => { cadastro = dados; return { error: null }; },
            signInWithPassword: async () => ({ data: { user: { email_confirmed_at: confirmado ? '2026-01-01' : null }, session: { access_token: 'token-teste', refresh_token: 'privado' } }, error: null })
        } });
        const res = resposta();
        await cadastrarContaAdotante({ body: { nome: 'Pessoa', email: 'pessoa@example.com', password: 'senha-teste', consentimento: true } }, res);
        assert.equal(res.codigo, 201);
        assert.deepEqual(cadastro.options.data, { nome: 'Pessoa' });
        assert.equal(res.dados.token, undefined);
        const naoConfirmado = resposta();
        await entrarContaAdotante({ body: {} }, naoConfirmado);
        assert.equal(naoConfirmado.codigo, 403);
        confirmado = true;
        const login = resposta();
        await entrarContaAdotante({ body: {} }, login);
        assert.deepEqual(login.dados, { sucesso: true, token: 'token-teste' });
    } finally { contaAdotanteAuth.criarCliente = original; }
});

test('rota isola duas contas mesmo quando o cliente pede o e-mail de outra pessoa', async t => {
    const originalAuth = supabaseAdmin.auth.getUser;
    const originalFrom = supabaseAdmin.from;
    const consultas = [];
    supabaseAdmin.auth.getUser = async token => ({ data: { user: { email: `${token}@example.com`, email_confirmed_at: '2026-01-01', user_metadata: { nome: token } } }, error: null });
    supabaseAdmin.from = tabela => {
        let email;
        const q = { select() { return this; }, eq(campo, valor) { if (campo === 'email') { email = valor; consultas.push(valor); } return this; },
            maybeSingle: async () => ({ data: { id: email === 'conta-a@example.com' ? 1 : 2, status: 'em triagem', etapa: 'triagem', interesse: { animal_nome: email === 'conta-a@example.com' ? 'Mel' : 'Bob', mensagem: 'privado' } }, error: null }),
            order() { return this; }, limit: async () => ({ data: [{ etapa: 'triagem', criado_em: '2026-10-27', nota: 'nota privada', autor_id: 'equipe' }], error: null }) };
        return q;
    };
    const servidor = app.listen(0, '127.0.0.1');
    await new Promise(resolve => servidor.once('listening', resolve));
    t.after(async () => { supabaseAdmin.auth.getUser = originalAuth; supabaseAdmin.from = originalFrom; await new Promise(resolve => servidor.close(resolve)); });
    const base = `http://127.0.0.1:${servidor.address().port}`;
    const semSessao = await fetch(base + '/api/conta-adotante');
    assert.equal(semSessao.status, 401); await semSessao.text();
    for (const [token, animal] of [['conta-a', 'Mel'], ['conta-b', 'Bob']]) {
        const res = await fetch(base + '/api/conta-adotante?email=outra@example.com', { headers: { Authorization: `Bearer ${token}` } });
        assert.equal(res.status, 200);
        const dados = await res.json();
        assert.equal(dados.conta.email, `${token}@example.com`);
        assert.equal(dados.interesse.animal_nome, animal);
        assert.equal(JSON.stringify(dados).includes('privado'), false);
        assert.equal(JSON.stringify(dados).includes('autor_id'), false);
    }
    assert.deepEqual(consultas, ['conta-a@example.com', 'conta-b@example.com']);
});

test('cadastro de adotante exige consentimento e senha e rejeita permissões administrativas', () => {
    const valido={nome:'Pessoa Teste',email:'teste@example.com',password:'senha-de-teste',consentimento:true};
    assert.equal(cadastroContaAdotanteSchema.safeParse(valido).success,true);
    assert.equal(cadastroContaAdotanteSchema.safeParse({...valido,password:'123'}).success,false);
    assert.equal(cadastroContaAdotanteSchema.safeParse({...valido,consentimento:false}).success,false);
    assert.equal(cadastroContaAdotanteSchema.safeParse({...valido,perfil:'admin'}).success,false);
});

test('área do adotante rejeita ausência de token e e-mail não confirmado', async () => {
    const original=supabaseAdmin.auth.getUser;
    let next=false;
    try {
        const semToken=resposta();
        await verificarContaAdotante({headers:{}},semToken,()=>{next=true;});
        assert.equal(semToken.codigo,401);
        supabaseAdmin.auth.getUser=async()=>({data:{user:{email:'teste@example.com'}},error:null});
        const semConfirmacao=resposta();
        await verificarContaAdotante({headers:{authorization:'Bearer token'}},semConfirmacao,()=>{next=true;});
        assert.equal(semConfirmacao.codigo,401);
        assert.equal(next,false);
    } finally {supabaseAdmin.auth.getUser=original;}
});

test('consulta usa e-mail validado da sessão e devolve somente o acompanhamento próprio', async () => {
    const originalAuth=supabaseAdmin.auth.getUser;
    const originalFrom=supabaseAdmin.from;
    let emailConsultado;
    try {
        supabaseAdmin.auth.getUser=async()=>({data:{user:{email:'proprio@example.com',email_confirmed_at:'2026-01-01',user_metadata:{nome:'Pessoa'}}},error:null});
        const req={headers:{authorization:'Bearer token'},query:{email:'outra@example.com'}};
        let next=false;
        await verificarContaAdotante(req,resposta(),()=>{next=true;});
        assert.equal(next,true);
        supabaseAdmin.from=()=>({select(){return this;},eq(campo,email){emailConsultado=email;return this;},async maybeSingle(){return {data:{status:'em triagem',interesse:{animal_nome:'Mel',mensagem:'informação privada',cidade:'Balsas'}},error:null};}});
        const res=resposta();await obterContaAdotante(req,res);
        assert.equal(emailConsultado,'proprio@example.com');
        assert.equal(res.dados.interesse.animal_nome,'Mel');
        assert.equal(res.dados.interesse.mensagem,undefined);
        assert.equal(res.dados.conta.email,'proprio@example.com');
    } finally {supabaseAdmin.auth.getUser=originalAuth;supabaseAdmin.from=originalFrom;}
});

test('consulta sem manifestação não cria pedido nem inventa situação', async () => {
    const original=supabaseAdmin.from;
    try {
        supabaseAdmin.from=()=>({select(){return this;},eq(){return this;},async maybeSingle(){return {data:null,error:null};}});
        const res=resposta();await obterContaAdotante({contaAdotante:{email:'teste@example.com'}},res);
        assert.equal(res.dados.interesse,null);
    } finally {supabaseAdmin.from=original;}
});

test('área do adotante consulta somente eventos de etapa e não devolve notas',async()=>{
    const original=supabaseAdmin.from;const consultas=[];
    try{
        supabaseAdmin.from=tabela=>({select(campos){consultas.push([tabela,campos]);return this;},eq(c,v){consultas.push([c,v]);return this;},async maybeSingle(){return {data:{id:8,status:'aprovado',etapa:'entrevista',interesse:{animal_nome:'Mel'}},error:null};},order(){return this;},async limit(){return {data:[{etapa:'entrevista',criado_em:'2026-10-09'}],error:null};}});
        const res=resposta();await obterContaAdotante({contaAdotante:{email:'proprio@example.com'}},res);
        assert.ok(consultas.some(c=>c[0]==='email'&&c[1]==='proprio@example.com'));
        assert.ok(consultas.some(c=>c[0]==='tipo'&&c[1]==='etapa'));
        assert.deepEqual(consultas.find(c=>c[0]==='acompanhamento_eventos'),['acompanhamento_eventos','etapa,criado_em']);
        assert.equal(res.dados.interesse.etapa,'entrevista');assert.equal(res.dados.interesse.eventos.length,1);
    }finally{supabaseAdmin.from=original;}
});
test('conclusão mostra o animal efetivamente adotado, sem usar apenas a preferência original',async()=>{
    const original=supabaseAdmin.from;
    try{
        supabaseAdmin.from=tabela=>({select(){return this;},eq(){return this;},order(){return this;},limit(){return tabela==='acompanhamento_eventos'?Promise.resolve({data:[],error:null}):this;},async maybeSingle(){return {data:tabela==='adotantes'?{id:8,etapa:'concluida',interesse:{animal_nome:'Preferência anterior'}}:tabela==='adocoes'?{animal_id:9,data_adocao:'2026-10-09'}:{nome:'Animal adotado'},error:null};}});
        const res=resposta();await obterContaAdotante({contaAdotante:{email:'proprio@example.com'}},res);
        assert.deepEqual(res.dados.interesse.adocao,{animal_nome:'Animal adotado',data_adocao:'2026-10-09'});
        assert.equal(res.dados.interesse.adocao.animal_id,undefined);
    }finally{supabaseAdmin.from=original;}
});
