import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Controladores
import { listarAnimais, cadastrarAnimal, atualizarAnimal, buscaInteligente } from './controllers/animalController.js';
import { login } from './controllers/authController.js';
import { conversarComAgente } from './controllers/agentController.js';
import { cadastrarAdotante, listarAdotantes, atualizarStatusAdotante } from './controllers/adotanteController.js';
import { obterDashboard } from './controllers/dashboardController.js';
import {
  registrarResgate,
  registrarSaude,
  registrarVacina,
  registrarTratamento,
  obterHistoricoAnimal,
  registrarAdocao,
  listarAdocoes
} from './controllers/historicoController.js';

// Middlewares e Schemas (Zod)
import { verificarToken, exigirPermissao } from './middlewares/authMiddleware.js';
import { validarRequest } from './middlewares/validationMiddleware.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { limiteLogin, limiteBuscaInteligente } from './middlewares/securityMiddleware.js';
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
} from './schemas/validationSchemas.js';

const app = express();
app.disable('x-powered-by');
const protegerONG = [verificarToken, exigirPermissao('admin', 'voluntario', 'veterinario')];
const origensPermitidas = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origem) => origem.trim());

app.use(helmet());
app.use(cors({
  origin: (origem, callback) => {
    if (!origem || origensPermitidas.includes(origem)) return callback(null, true);
    return callback(new Error('Origem não autorizada.'));
  }
}));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ sucesso: true, status: 'ativo' });
});

// --- ROTA DE AUTENTICAÇÃO ---
app.post('/api/login', limiteLogin, validarRequest(loginSchema), login);

// --- ROTAS PÚBLICAS ---
app.get('/api/animais', listarAnimais);
app.post('/api/busca-inteligente', limiteBuscaInteligente, validarRequest(buscaSchema), buscaInteligente);
app.post('/api/agente', limiteBuscaInteligente, conversarComAgente);
app.post('/api/adotantes', validarRequest(adotanteSchema), cadastrarAdotante); 

// --- ROTAS PROTEGIDAS ---
app.post('/api/animais', ...protegerONG, validarRequest(animalSchema), cadastrarAnimal);
app.get('/api/admin/animais', ...protegerONG, listarAnimais);
app.put('/api/animais/:id', ...protegerONG, validarRequest(animalUpdateSchema), atualizarAnimal);

app.get('/api/animais/:id/historico', ...protegerONG, obterHistoricoAnimal);
app.post('/api/animais/:id/resgates', ...protegerONG, validarRequest(resgateSchema), registrarResgate);
app.post('/api/animais/:id/saude', ...protegerONG, validarRequest(saudeSchema), registrarSaude);
app.post('/api/animais/:id/vacinas', ...protegerONG, validarRequest(vacinaSchema), registrarVacina);
app.post('/api/animais/:id/tratamentos', ...protegerONG, validarRequest(tratamentoSchema), registrarTratamento);

app.post('/api/adocoes', ...protegerONG, validarRequest(adocaoSchema), registrarAdocao);
app.get('/api/adocoes', ...protegerONG, listarAdocoes);

app.get('/api/adotantes', ...protegerONG, listarAdotantes);
app.put('/api/adotantes/:id/status', ...protegerONG, atualizarStatusAdotante);
app.get('/api/dashboard', ...protegerONG, obterDashboard);

app.use(errorHandler);

export default app;