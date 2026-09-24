import { supabase } from '../config/database.js';

export async function verificarToken(req, res, next) {
  // O token vem no cabeçalho no formato: "Bearer eyJhbGciOiJIUz..."
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
  }

  try {
    // Pedimos ao Supabase para validar se o token é real e não expirou
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) throw new Error('Token inválido.');

    // Se estiver tudo bem, guardamos os dados do utilizador e deixamos a requisição passar
    req.user = user; 
    next(); 
    
  } catch (error) {
    res.status(401).json({ erro: 'Acesso negado. Token inválido ou expirado.' });
  }
}