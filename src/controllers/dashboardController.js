export async function obterDashboard(req, res) {
  try {
    // 1. Animais Acolhidos (Exclui os que já foram adotados para saber a lotação atual)
    const { count: animaisAcolhidos, error: erroAnimais } = await req.supabase
      .from('animais')
      .select('*', { count: 'exact', head: true })
      .neq('situacao', 'adotado');

    // 2. Adoções Concluídas (Total histórico)
    const { count: adocoes, error: erroAdocoes } = await req.supabase
      .from('adocoes')
      .select('*', { count: 'exact', head: true });

    // 3. Sob Cuidados Médicos
    const { count: cuidadosMedicos, error: erroCuidados } = await req.supabase
      .from('animais')
      .select('*', { count: 'exact', head: true })
      .eq('situacao', 'em tratamento');

    // 4. Pedidos Pendentes (Pessoas interessadas que aguardam resposta)
    const { count: pedidosPendentes, error: erroPedidos } = await req.supabase
      .from('adotantes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'em triagem');

    // Se alguma das consultas falhar, atiramos o erro para o catch
    if (erroAnimais) throw erroAnimais;
    if (erroAdocoes) throw erroAdocoes;
    if (erroCuidados) throw erroCuidados;
    if (erroPedidos) throw erroPedidos;

    // Retorna os dados formatados para os cartões da interface
    res.status(200).json({
      sucesso: true,
      dados: {
        animais_acolhidos: animaisAcolhidos || 0,
        adocoes_concluidas: adocoes || 0,
        cuidados_medicos: cuidadosMedicos || 0,
        pedidos_pendentes: pedidosPendentes || 0
      }
    });

  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
}