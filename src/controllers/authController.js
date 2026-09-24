import { supabase } from '../config/database.js';

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ erro: 'Email e palavra-passe são obrigatórios.' });
    }

    // O Supabase verifica as credenciais na sua própria tabela segura de Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Devolvemos o token que o front-end usará nas próximas requisições
    res.status(200).json({ 
      sucesso: true, 
      token: data.session.access_token 
    });

  } catch (error) {
    res.status(401).json({ sucesso: false, erro: 'Credenciais inválidas.' });
  }
}