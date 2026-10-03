import { createClient } from '@supabase/supabase-js';

export const verificarToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !/^Bearer\s+\S+$/i.test(authHeader)) {
    return res.status(401).json({ erro: 'Acesso negado. Use o formato Bearer <token>.' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');

  // Cria um cliente isolado garantindo que a requisição X não usa a sessão da requisição Y
  const supabaseScoped = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false }
    }
  );

  const { data: { user }, error } = await supabaseScoped.auth.getUser();

  if (error || !user) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }

  // Injeta o cliente autenticado na requisição para ser usado pelos controladores
  req.supabase = supabaseScoped;
  req.user = user;

  next();
};

export const exigirPermissao = (...perfisPermitidos) => {
  return (req, res, next) => {
    const perfil = req.user?.app_metadata?.role || req.user?.user_metadata?.role;

    if (perfisPermitidos.length > 0 && !perfisPermitidos.includes(perfil)) {
      return res.status(403).json({ erro: 'Usuário sem permissão para esta operação.' });
    }

    next();
  };
};