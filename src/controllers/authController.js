import { supabase } from '../config/database.js';

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
    }

    // Comunica com o sistema de autenticação nativo do Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    res.status(200).json({
      sucesso: true,
      token: data.session.access_token, // Este é o token que o front-end vai usar
      usuario: {
        id: data.user.id,
        email: data.user.email
      }
    });
    
  } catch (error) {
    res.status(401).json({ sucesso: false, erro: 'Credenciais inválidas. Verifique o email e a senha.' });
  }
}