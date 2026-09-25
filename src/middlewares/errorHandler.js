export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const status = error.status || error.statusCode || 500;
  const mensagem = status >= 500 ? 'Erro interno do servidor.' : error.message;

  console.error(`[${req.method}] ${req.originalUrl}`, error);
  return res.status(status).json({ sucesso: false, erro: mensagem });
}
