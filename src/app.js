import { cadastrarContaAdotante, entrarContaAdotante, verificarContaAdotante, obterContaAdotante } from './controllers/contaAdotanteController.js';
import { cadastroContaAdotanteSchema } from './schemas/validationSchemas.js';
import { listarInteressados, historicoInteressado, atualizarAcompanhamento } from './controllers/interessadosController.js';
import { acompanhamentoSchema } from './schemas/interessadosSchemas.js';
import { obterAnimalPublico, manifestarInteresse, obterResultadosPublicos } from './controllers/publicoController.js';
import { interesseSchema } from './schemas/validationSchemas.js';
import rateLimit from 'express-rate-limit';
import { recuperarSenha, redefinirSenha } from './controllers/recuperacaoController.js';
import { recuperarSchema, redefinirSchema } from './schemas/recuperacaoSchemas.js';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { enviarImagemAnimal } from './controllers/imagemController.js';
import path from "node:path";
import { fileURLToPath } from "node:url";

// Controladores
import {
    listarAnimais,
    cadastrarAnimal,
    atualizarAnimal,
    buscaInteligente
} from "./controllers/animalController.js";

import {
    login
} from "./controllers/authController.js";

import {
    conversarComAgente
} from "./controllers/agentController.js";

import {
    cadastrarAdotante,
    listarAdotantes,
    atualizarStatusAdotante
} from "./controllers/adotanteController.js";

import {
    obterDashboard
} from "./controllers/dashboardController.js";

import {
    obterPerfil,
    atualizarPerfil
} from "./controllers/perfilController.js";

import {
    registrarResgate,
    listarResgates,
    registrarSaude,
    registrarVacina,
    registrarTratamento,
    obterHistoricoAnimal,
    registrarAdocao,
    listarAdocoes
} from "./controllers/historicoController.js";

// Middlewares
import {
    verificarToken,
    exigirPermissao
} from "./middlewares/authMiddleware.js";

import {
    validarRequest
} from "./middlewares/validationMiddleware.js";

import {
    errorHandler
} from "./middlewares/errorHandler.js";

import {
    limiteLogin,
    limiteBuscaInteligente
} from "./middlewares/securityMiddleware.js";

// Schemas
import {
    animalSchema,
    animalUpdateSchema,
    adotanteSchema,
    loginSchema,
    buscaSchema,
    resgateSchema,
    saudeSchema,
    vacinaSchema,
    tratamentoSchema,
    adocaoSchema
} from "./schemas/validationSchemas.js";

const app = express();

app.disable("x-powered-by");
if (process.env.RENDER === 'true') app.set('trust proxy', 1);

const protegerONG = [
    verificarToken,
    exigirPermissao(
        "admin",
        "voluntario",
        "veterinario"
    )
];

const origensPermitidas = (
    process.env.FRONTEND_URL ||
    "http://localhost:5173"
)
    .split(",")
    .map((origem) => origem.trim());

if (process.env.RENDER_EXTERNAL_URL) {
    origensPermitidas.push(new URL(process.env.RENDER_EXTERNAL_URL).origin);
}

app.use(helmet({ contentSecurityPolicy: { directives: { imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'] } } }));

app.use(
    cors({
        origin: (origem, callback) => {
            if (
                !origem ||
                origensPermitidas.includes(origem)
            ) {
                return callback(null, true);
            }

            return callback(
                new Error(
                    "Origem não autorizada."
                )
            );
        }
    })
);

app.use(
    express.json({
        limit: "1mb"
    })
);

// Publica somente os arquivos da interface. A raiz contém .env e código interno.
const raizProjeto = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
app.get(['/', '/index.html'], (req, res) => res.sendFile(path.join(raizProjeto, 'index.html')));
for (const pasta of ['pages', 'css', 'js', 'assets']) {
    app.use(`/${pasta}`, express.static(path.join(raizProjeto, pasta), { dotfiles: 'deny' }));
}

// --- SAÚDE DA API ---

app.get(
    "/health",
    (req, res) => {
        res.status(200).json({
            sucesso: true,
            status: "ativo"
        });
    }
);

// --- AUTENTICAÇÃO ---

app.post(
    "/api/login",
    limiteLogin,
    validarRequest(loginSchema),
    login
);

// --- ROTAS PÚBLICAS ---

const tratarRecuperacao = (handler) => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
app.post('/api/recuperar-senha', limiteLogin, validarRequest(recuperarSchema), tratarRecuperacao(recuperarSenha));
app.post('/api/redefinir-senha', limiteLogin, validarRequest(redefinirSchema), tratarRecuperacao(redefinirSenha));

const tratarPublico = (handler) => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
const tratarConta = (req, res, next) => verificarContaAdotante(req, res, next).catch(next);
app.post('/api/conta-adotante/cadastro', limiteLogin, validarRequest(cadastroContaAdotanteSchema), tratarPublico(cadastrarContaAdotante));
app.post('/api/conta-adotante/entrar', limiteLogin, validarRequest(loginSchema), tratarPublico(entrarContaAdotante));
app.get('/api/conta-adotante', tratarConta, tratarPublico(obterContaAdotante));

app.get('/api/admin/interessados', ...protegerONG, tratarPublico(listarInteressados));
app.get('/api/admin/interessados/:id/historico', ...protegerONG, tratarPublico(historicoInteressado));
app.post('/api/admin/interessados/:id/acompanhamento', ...protegerONG, validarRequest(acompanhamentoSchema), tratarPublico(atualizarAcompanhamento));

app.get('/api/animais/:id', tratarPublico(obterAnimalPublico));
app.get('/api/resultados', tratarPublico(obterResultadosPublicos));
app.post('/api/interesses', rateLimit({
    windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { sucesso: false, erro: 'Limite de envios atingido. Tente novamente mais tarde.' }
}), validarRequest(interesseSchema), tratarPublico(manifestarInteresse));

app.get(
    "/api/animais",
    listarAnimais
);

app.post(
    "/api/busca-inteligente",
    limiteBuscaInteligente,
    validarRequest(buscaSchema),
    buscaInteligente
);

app.post(
    "/api/agente",
    limiteBuscaInteligente,
    conversarComAgente
);

app.post(
    "/api/adotantes",
    ...protegerONG,
    validarRequest(adotanteSchema),
    cadastrarAdotante
);

// --- PERFIL DO USUÁRIO ---

app.get(
    "/api/perfil",
    ...protegerONG,
    obterPerfil
);

app.put(
    "/api/perfil",
    ...protegerONG,
    atualizarPerfil
);

// --- ANIMAIS ---

app.post('/api/animais/imagem', ...protegerONG,
    express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '5mb' }),
    enviarImagemAnimal);

app.post(
    "/api/animais",
    ...protegerONG,
    validarRequest(animalSchema),
    cadastrarAnimal
);

app.get(
    "/api/admin/animais",
    ...protegerONG,
    listarAnimais
);

app.put(
    "/api/animais/:id",
    ...protegerONG,
    validarRequest(animalUpdateSchema),
    atualizarAnimal
);

// --- HISTÓRICO DOS ANIMAIS ---

app.get(
    "/api/animais/:id/historico",
    ...protegerONG,
    obterHistoricoAnimal
);

app.get('/api/resgates', ...protegerONG, listarResgates);

app.post(
    "/api/animais/:id/resgates",
    ...protegerONG,
    validarRequest(resgateSchema),
    registrarResgate
);

app.post(
    "/api/animais/:id/saude",
    ...protegerONG,
    validarRequest(saudeSchema),
    registrarSaude
);

app.post(
    "/api/animais/:id/vacinas",
    ...protegerONG,
    validarRequest(vacinaSchema),
    registrarVacina
);

app.post(
    "/api/animais/:id/tratamentos",
    ...protegerONG,
    validarRequest(tratamentoSchema),
    registrarTratamento
);

// --- ADOÇÕES ---

app.post(
    "/api/adocoes",
    ...protegerONG,
    validarRequest(adocaoSchema),
    registrarAdocao
);

app.get(
    "/api/adocoes",
    ...protegerONG,
    listarAdocoes
);

// --- ADOTANTES ---

app.get(
    "/api/adotantes",
    ...protegerONG,
    listarAdotantes
);

app.put(
    "/api/adotantes/:id/status",
    ...protegerONG,
    atualizarStatusAdotante
);

// --- DASHBOARD ---

app.get(
    "/api/dashboard",
    ...protegerONG,
    obterDashboard
);

// --- TRATAMENTO CENTRAL DE ERROS ---

app.use(errorHandler);

export default app;
