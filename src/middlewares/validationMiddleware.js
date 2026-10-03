export const validarRequest = (schema) => {
  return (req, res, next) => {
    // safeParse não "quebra" o servidor se der erro, apenas devolve um objeto com o resultado
    const resultado = schema.safeParse(req.body);

    if (!resultado.success) {
      // Extrai apenas as mensagens de erro úteis geradas pelo Zod
      const errosFormatados = resultado.error.issues.map(issue => ({
        campo: issue.path[0],
        mensagem: issue.message
      }));

      return res.status(400).json({
        sucesso: false,
        erro: 'Falha na validação dos dados.',
        detalhes: errosFormatados
      });
    }

    // O Zod também remove campos extras que não estão no schema, limpando ataques de injeção
    req.body = resultado.data; 
    next();
  };
};