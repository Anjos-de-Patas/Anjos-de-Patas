import express from 'express';
import cors from 'cors';

// Controladores
import { listarAnimais, cadastrarAnimal, atualizarAnimal, buscaInteligente } from './controllers/animalController.js';
import { login } from './controllers/authController.js';
import { cadastrarAdotante, listarAdotantes, atualizarStatusAdotante } from './controllers/adotanteController.js';

// Middlewares e Schemas (Zod)
import { verificarToken } from './middlewares/authMiddleware.js';
import { validarRequest } from './middlewares/validationMiddleware.js';
import { animalSchema, adotanteSchema } from './schemas/validationSchemas.js';

const app = express();
app.use(cors());
app.use(express.json());

// --- ROTA DE AUTENTICAÇÃO ---
app.post('/api/login', login);

// --- ROTAS PÚBLICAS ---
app.get('/api/animais', listarAnimais);
app.post('/api/busca-inteligente', buscaInteligente);
app.post('/api/adotantes', validarRequest(adotanteSchema), cadastrarAdotante); 

// --- ROTAS PROTEGIDAS ---
app.post('/api/animais', verificarToken, validarRequest(animalSchema), cadastrarAnimal);
app.put('/api/animais/:id', verificarToken, validarRequest(animalSchema), atualizarAnimal);

app.get('/api/adotantes', verificarToken, listarAdotantes);
app.put('/api/adotantes/:id/status', verificarToken, atualizarStatusAdotante);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor back-end ativo na porta ${PORT}`);
});