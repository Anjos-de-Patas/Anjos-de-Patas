const pptxgen = require('pptxgenjs');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const sharp = require('sharp');
const fa = require('react-icons/fa6');
const { applyTheme } = require('/root/.claude/skills/synced/501de9b7-33ca-4a84-ae64-2bd19a73b3c3_5059c7af-527a-4bbb-9658-1197d3ceb200/pptx/scripts/apply_theme.js');

const THEME = { name: 'Anjos de Patas', headFontFace: 'Calibri', bodyFontFace: 'Calibri',
  colors: { dk1: '39291F', lt1: 'FFFFFF', dk2: '52392C', lt2: 'F8EFE2', accent1: 'EDC785', accent2: '805A26', accent3: '32664B',
            accent4: 'C0504D', accent5: '715D4D', accent6: 'E6D9C8', hlink: '805A26', folHlink: '715D4D' } };
const HEX = { marrom: '52392C', dourado: 'EDC785', bege: 'F8EFE2', texto: '39291F', sec: '715D4D', verde: '32664B', borda: 'E6D9C8' };

async function icon(Comp, color = '#52392C', size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color, size }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return 'image/png;base64,' + buf.toString('base64');
}

(async () => {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  pres.title = 'Anjos de Patas - Pitch da solução';
  pres.author = 'Equipe Anjos de Patas';
  const C = pres.SchemeColor;

  pres.defineSlideMaster({ title: 'CAPA_ESCURA', background: { color: HEX.marrom },
    objects: [{ placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 1.55, w: 5.0, h: 1.3, fontSize: 44, bold: true, color: C.background1, valign: 'top', align: 'left', margin: 0 }, text: '' } },
              { placeholder: { options: { name: 'body', type: 'body', x: 0.6, y: 2.95, w: 5.0, h: 0.9, fontSize: 18, color: C.accent1, valign: 'top', align: 'left', margin: 0 }, text: '' } }] });
  pres.defineSlideMaster({ title: 'CONTEUDO', background: { color: 'FFFFFF' },
    objects: [{ placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.32, w: 9.0, h: 0.7, fontSize: 30, bold: true, color: C.text2, valign: 'middle', align: 'left', margin: 0 }, text: '' } }],
    slideNumber: { x: 9.2, y: 5.2, w: 0.5, h: 0.3, fontSize: 10, color: '715D4D' } });

  const ic = {
    pasta: await icon(fa.FaFolderOpen), hist: await icon(fa.FaClockRotateLeft), mao: await icon(fa.FaHandHoldingHeart), grafico: await icon(fa.FaChartColumn),
    equipe: await icon(fa.FaUserGroup, '#FFFFFF'), adotante: await icon(fa.FaHeart, '#FFFFFF'), check: await icon(fa.FaCircleCheck, '#52392C'),
    seta: await icon(fa.FaArrowRight, '#805A26'), robo: await icon(fa.FaRobot, '#FFFFFF'), estrela: await icon(fa.FaStar), rota: await icon(fa.FaRoute),
  };
  const card = (s, x, y, w, h, fill = HEX.bege) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: fill }, objectName: 'Cartão' });
  const circ = (s, x, y, d, color, img) => { s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color }, line: { color }, objectName: 'Círculo do ícone' }); s.addImage({ data: img, x: x + d * 0.25, y: y + d * 0.25, w: d * 0.5, h: d * 0.5, objectName: 'Ícone' }); };
  const txt = (s, t, o) => s.addText(t, Object.assign({ isTextBox: true, fontSize: 14, color: HEX.texto, margin: 0, valign: 'top' }, o));
  const shot = (s, path, x, y, w, h) => { s.addShape(pres.shapes.RECTANGLE, { x: x - 0.03, y: y - 0.03, w: w + 0.06, h: h + 0.06, fill: { color: 'FFFFFF' }, line: { color: HEX.borda, width: 1 }, shadow: { type: 'outer', color: '000000', opacity: 0.18, blur: 8, offset: 3, angle: 90 } }); s.addImage({ path, x, y, w, h, sizing: { type: 'cover', w, h }, objectName: 'Captura de tela' }); };

  // 1 Capa
  pres.addSection({ title: 'Abertura' });
  let s = pres.addSlide({ masterName: 'CAPA_ESCURA', sectionTitle: 'Abertura' });
  s.addImage({ path: 'hero_r.jpg', x: 5.9, y: 0, w: 4.1, h: 5.625, sizing: { type: 'cover', w: 4.1, h: 5.625 }, objectName: 'Foto de abertura' });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 0.55, w: 1.7, h: 0.85, rectRadius: 0.1, fill: { color: 'FFFFFF' }, line: { color: 'FFFFFF' } });
  s.addImage({ path: 'logo.png', x: 0.7, y: 0.6, w: 1.5, h: 0.75, objectName: 'Logo' });
  s.addText('Anjos de Patas', { placeholder: 'title' });
  s.addText('Tecnologia a serviço da adoção responsável de cães e gatos em Balsas - MA', { placeholder: 'body' });
  txt(s, 'Carinne da Silva Borges · Rogério Mota de Melo · Júlio Cesar Lima dos Reis · João Pedro Strasser Santos', { x: 0.6, y: 4.35, w: 5.0, h: 0.5, fontSize: 12, color: 'E8D9C4' });
  txt(s, 'Análise e Desenvolvimento de Sistemas · UNIBALSAS · 2026', { x: 0.6, y: 4.85, w: 5.0, h: 0.3, fontSize: 12, color: 'E8D9C4' });
  s.addNotes('Apresentação da equipe e do projeto: uma plataforma web para a Sociedade Protetora dos Animais Anjos de Patas.');

  // 2 Problema
  pres.addSection({ title: 'Problema' });
  s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Problema' });
  s.addText('Informações espalhadas dificultam o cuidado', { placeholder: 'title' });
  txt(s, 'Diagnóstico feito com a ONG Anjos de Patas', { x: 0.5, y: 1.05, w: 9, h: 0.3, fontSize: 14, color: HEX.sec, italic: true });
  const probs = [[ic.pasta, 'Informações dispersas', 'Planilhas, conversas de WhatsApp e anotações'], [ic.hist, 'Sem histórico por animal', 'Resgate, vacinas e tratamentos registrados em lugares diferentes'],
                 [ic.mao, 'Adoção controlada à mão', 'A situação do animal precisa ser atualizada em vários meios'], [ic.grafico, 'Indicadores manuais', 'Contar resgates e adoções exige reunir dados um a um']];
  probs.forEach(([im, t, d], i) => { const x = 0.5 + i * 2.3; card(s, x, 1.6, 2.1, 3.3); circ(s, x + 0.2, 1.85, 0.75, 'FFFFFF', im); txt(s, t, { x: x + 0.2, y: 2.8, w: 1.75, h: 0.75, fontSize: 16, bold: true, color: HEX.marrom }); txt(s, d, { x: x + 0.2, y: 3.6, w: 1.75, h: 1.2, fontSize: 13, color: HEX.sec }); });
  s.addNotes('Resultado do levantamento com a ONG: informações espalhadas, sem histórico centralizado, controle manual da adoção e indicadores feitos à mão.');

  // 3 Para quem
  s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Problema' });
  s.addText('Dois públicos, duas necessidades', { placeholder: 'title' });
  [[ic.equipe, HEX.marrom, 'Equipe da ONG', 'Responsáveis e voluntários', ['Registrar e consultar o histórico de cada animal', 'Acompanhar vacinas, tratamentos e adoções', 'Ter tudo em um só lugar, simples de usar']],
   [ic.adotante, HEX.verde, 'Quem quer adotar', 'Pessoas da comunidade', ['Ver quais animais estão disponíveis agora', 'Conhecer temperamento e convivência', 'Saber como iniciar e acompanhar o pedido']]].forEach(([im, cor, t, sub, itens], i) => {
    const x = 0.5 + i * 4.6; card(s, x, 1.3, 4.4, 3.65); circ(s, x + 0.3, 1.55, 0.8, cor, im);
    txt(s, t, { x: x + 1.3, y: 1.6, w: 2.9, h: 0.4, fontSize: 20, bold: true, color: HEX.marrom }); txt(s, sub, { x: x + 1.3, y: 2.02, w: 2.9, h: 0.3, fontSize: 13, color: HEX.sec });
    txt(s, itens.map((t2, k) => ({ text: t2, options: { bullet: true, breakLine: k < itens.length - 1, paraSpaceAfter: 8 } })), { x: x + 0.35, y: 2.7, w: 3.8, h: 2.0, fontSize: 15 });
  });
  s.addNotes('As personas do TED 1: a equipe interna precisa de organização; o adotante precisa de informação atualizada e de um caminho claro.');

  // 4 Solução
  pres.addSection({ title: 'Solução' });
  s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Solução' });
  s.addText('Uma plataforma única para cuidar, divulgar e adotar', { placeholder: 'title' });
  shot(s, 'inicio.png', 0.5, 1.3, 5.3, 3.31);
  [['Área pública', 'Animais disponíveis com filtros, perfil completo e manifestação de interesse'], ['Área administrativa', 'Cadastro, histórico de cuidados, interessados e registro das adoções'], ['Conta do adotante', 'Acompanhamento das etapas do pedido, sem precisar ligar para a ONG']].forEach(([t, d], i) => {
    const y = 1.3 + i * 1.12; circ(s, 6.15, y, 0.5, HEX.dourado, ic.check);
    txt(s, t, { x: 6.8, y: y - 0.02, w: 2.8, h: 0.35, fontSize: 16, bold: true, color: HEX.marrom }); txt(s, d, { x: 6.8, y: y + 0.33, w: 2.8, h: 0.7, fontSize: 13, color: HEX.sec });
  });
  txt(s, 'anjos-de-patas.netlify.app', { x: 0.5, y: 4.85, w: 5.3, h: 0.3, fontSize: 12, color: '805A26', italic: true });
  s.addNotes('Mostrar a página inicial publicada. Três frentes: público, equipe e adotante.');

  // 5 Fluxo da adoção
  s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Solução' });
  s.addText('Do primeiro clique à adoção registrada', { placeholder: 'title' });
  const etapas = [['Encontrar', 'Filtra por espécie e sexo'], ['Conhecer', 'Abre o perfil completo'], ['Manifestar interesse', 'Envia o formulário, sem custo'], ['Triagem e entrevista', 'Equipe avalia e anota'], ['Adoção registrada', 'Animal sai do catálogo; histórico fica']];
  etapas.forEach(([t, d], i) => {
    const x = 0.5 + i * 1.86; const last = i === etapas.length - 1;
    s.addShape(pres.shapes.OVAL, { x: x + 0.45, y: 1.6, w: 0.75, h: 0.75, fill: { color: last ? HEX.verde : HEX.marrom }, line: { color: last ? HEX.verde : HEX.marrom } });
    txt(s, String(i + 1), { x: x + 0.45, y: 1.6, w: 0.75, h: 0.75, fontSize: 22, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
    if (!last) s.addImage({ data: ic.seta, x: x + 1.47, y: 1.83, w: 0.3, h: 0.3 });
    txt(s, t, { x, y: 2.55, w: 1.65, h: 0.65, fontSize: 15, bold: true, color: HEX.marrom, align: 'center' });
    txt(s, d, { x, y: 3.2, w: 1.65, h: 0.7, fontSize: 13, color: HEX.sec, align: 'center' });
  });
  card(s, 0.5, 4.2, 9.0, 0.75);
  txt(s, 'O adotante acompanha cada etapa na própria conta; notas e contatos ficam restritos à equipe.', { x: 0.75, y: 4.2, w: 8.5, h: 0.75, fontSize: 14, color: HEX.marrom, valign: 'middle' });
  s.addNotes('Fluxo completo. Destaque: o formulário não reserva o animal, inicia a triagem. A adoção só é registrada para interessado aprovado.');

  // 6 Equipe
  s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Solução' });
  s.addText('Para a equipe: o histórico em um só lugar', { placeholder: 'title' });
  shot(s, 'hist.png', 4.3, 1.3, 5.2, 3.79);
  const feats = ['Cadastro com foto, características e situação', 'Resgates, saúde, vacinas e tratamentos no histórico', 'Interessados com etapas, notas e contatos', 'Adoção registrada em transação, sem perder dados', 'Visão geral com indicadores e atalhos'];
  txt(s, feats.map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < feats.length - 1, paraSpaceAfter: 10 } })), { x: 0.5, y: 1.4, w: 3.5, h: 3.6, fontSize: 15 });
  s.addNotes('Área administrativa: resolve diretamente os problemas do diagnóstico, principalmente o histórico não centralizado.');

  // 7 Anjos IA
  pres.addSection({ title: 'Inteligência Artificial' });
  s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Inteligência Artificial' });
  s.addText('Anjos IA: orientação para quem vai adotar', { placeholder: 'title' });
  shot(s, 'ia.png', 0.6, 1.3, 3.75, 3.37);
  const ia = [['Conversa, uma pergunta por vez', 'Rotina, casa, crianças e outros animais antes de recomendar'], ['Recomenda só animais reais', 'O Gemini interpreta o pedido e o sistema consulta o banco; até 3 cartões com link'],
              ['Sempre disponível', 'Novas tentativas e modo guiado quando a IA está indisponível'], ['Responsável com dados', 'Não pede dados pessoais e não reserva animais']];
  ia.forEach(([t, d], i) => { const y = 1.3 + i * 0.86; txt(s, t, { x: 4.8, y, w: 4.7, h: 0.32, fontSize: 15, bold: true, color: HEX.marrom }); txt(s, d, { x: 4.8, y: y + 0.32, w: 4.7, h: 0.5, fontSize: 13, color: HEX.sec }); });
  txt(s, 'Também disponível como ANJOS IA (Dify), em página própria do site', { x: 4.8, y: 4.82, w: 4.7, h: 0.3, fontSize: 12, italic: true, color: '805A26' });
  s.addNotes('Diferencial de IA: o modelo interpreta linguagem natural em filtros estruturados, mas quem responde com animais é o banco de dados real. Ajustes vieram de relatos de usuários em teste.');

  // 8 Tecnologia
  pres.addSection({ title: 'Resultados' });
  s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Resultados' });
  s.addText('Arquitetura simples, publicada e protegida', { placeholder: 'title' });
  const cam = [['Interface', 'HTML, CSS e JavaScript responsivos', HEX.bege], ['API', 'Node.js + Express em funções da Netlify', HEX.bege], ['Dados', 'Supabase: PostgreSQL, Auth e Storage', HEX.bege], ['IA', 'Google Gemini e Dify', HEX.bege]];
  cam.forEach(([t, d, f], i) => { const x = 0.5 + i * 2.3; card(s, x, 1.4, 2.05, 1.5, f); txt(s, t, { x: x + 0.2, y: 1.55, w: 1.7, h: 0.4, fontSize: 18, bold: true, color: HEX.marrom }); txt(s, d, { x: x + 0.2, y: 2.0, w: 1.7, h: 0.8, fontSize: 13, color: HEX.sec }); if (i < 3) s.addImage({ data: ic.seta, x: x + 2.07, y: 2.0, w: 0.2, h: 0.2 }); });
  const seg = ['Segurança em nível de linha (RLS) no banco', 'Acesso da equipe separado do acesso do adotante', 'Contrato OpenAPI com 34 operações documentadas', 'Rotina automática que mantém o banco ativo'];
  txt(s, seg.map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < seg.length - 1, paraSpaceAfter: 6 } })), { x: 0.5, y: 3.3, w: 9, h: 1.7, fontSize: 15 });
  s.addNotes('Mostrar que o planejamento do TED 1 foi mantido: cliente-servidor com Express e Supabase.');

  // 9 Resultados
  s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Resultados' });
  s.addText('Resultados: planejado, entregue e testado', { placeholder: 'title' });
  [['16/16', 'requisitos funcionais implementados'], ['115', 'testes automatizados aprovados'], ['20/20', 'cenários de homologação aprovados'], ['34', 'operações de API documentadas']].forEach(([n, l], i) => {
    const x = 0.5 + i * 2.3; card(s, x, 1.4, 2.05, 2.3);
    txt(s, n, { x: x + 0.1, y: 1.6, w: 1.85, h: 1.0, fontSize: 44, bold: true, color: i === 0 ? HEX.verde : HEX.marrom, align: 'center', valign: 'middle' });
    txt(s, l, { x: x + 0.15, y: 2.7, w: 1.75, h: 0.8, fontSize: 14, color: HEX.sec, align: 'center' });
  });
  txt(s, 'Além do escopo inicial: conta do adotante, gestão de interessados, transparência, perguntas frequentes e o assistente Anjos IA.', { x: 0.5, y: 4.05, w: 9, h: 0.6, fontSize: 15, color: HEX.texto });
  txt(s, 'Testes de 24/11/2026 · homologação de 27/10/2026 com banco real e dados fictícios', { x: 0.5, y: 4.75, w: 9, h: 0.3, fontSize: 11, italic: true, color: HEX.sec });
  s.addNotes('Números verificáveis no repositório (docs/evidencias).');

  // 10 Validação
  s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Resultados' });
  s.addText('Validação: o que a ONG e os usuários disseram', { placeholder: 'title' });
  shot(s, 'whats.png', 0.6, 1.35, 4.2, 2.64);
  txt(s, 'Retorno da ONG pelo WhatsApp', { x: 0.6, y: 4.15, w: 4.2, h: 0.3, fontSize: 12, italic: true, color: HEX.sec });
  const val = [['ONG', 'Acessou pelo celular e aprovou a primeira impressão: "Mas já gostei sim". Próximo passo: revisão detalhada no computador.'],
               ['Adotantes em teste', 'Relataram falhas do assistente com mensagens seguidas; corrigimos com limite próprio, novas tentativas e modo guiado.'],
               ['Equipe', 'Homologação ponta a ponta, do cadastro à adoção, com histórico preservado.']];
  val.forEach(([t, d], i) => { const y = 1.35 + i * 1.18; txt(s, t, { x: 5.2, y, w: 4.3, h: 0.32, fontSize: 15, bold: true, color: HEX.marrom }); txt(s, d, { x: 5.2, y: y + 0.32, w: 4.3, h: 0.8, fontSize: 13, color: HEX.sec }); });
  s.addNotes('Ser honesto: o retorno da ONG é uma avaliação inicial positiva; a validação detalhada com a equipe é o próximo passo.');

  // 11 Próximos passos
  s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Resultados' });
  s.addText('Diferenciais e próximos passos', { placeholder: 'title' });
  card(s, 0.5, 1.3, 4.4, 3.65);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.1, y: 1.3, w: 4.4, h: 3.65, rectRadius: 0.08, fill: { color: 'FFFFFF' }, line: { color: HEX.borda, width: 1 } });
  circ(s, 0.75, 1.5, 0.6, 'FFFFFF', ic.estrela); txt(s, 'Diferenciais', { x: 1.5, y: 1.6, w: 3, h: 0.4, fontSize: 18, bold: true, color: HEX.marrom });
  circ(s, 5.35, 1.5, 0.6, HEX.bege, ic.rota); txt(s, 'Próximos passos', { x: 6.1, y: 1.6, w: 3, h: 0.4, fontSize: 18, bold: true, color: HEX.marrom });
  const dif = ['Feito a partir de um diagnóstico real da ONG', 'Histórico preservado mesmo após a adoção', 'IA que recomenda apenas animais cadastrados', 'Gratuito para hospedar e simples de manter'];
  const prox = ['Concluir a validação detalhada com a equipe da ONG', 'Cadastrar os animais reais e os canais oficiais de contato', 'Diferenciar permissões entre os perfis da equipe', 'Avaliação completa de acessibilidade'];
  txt(s, dif.map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < dif.length - 1, paraSpaceAfter: 8 } })), { x: 0.8, y: 2.35, w: 3.9, h: 2.5, fontSize: 14 });
  txt(s, prox.map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < prox.length - 1, paraSpaceAfter: 8 } })), { x: 5.4, y: 2.35, w: 3.9, h: 2.5, fontSize: 14 });
  s.addNotes('Fechar com o que torna a solução diferente e o que falta para o uso contínuo pela ONG.');

  // 12 Encerramento
  pres.addSection({ title: 'Encerramento' });
  s = pres.addSlide({ masterName: 'CAPA_ESCURA', sectionTitle: 'Encerramento' });
  s.addText('Obrigado!', { placeholder: 'title' });
  s.addText('Cada focinho merece um lar. Acesse e conheça a solução.', { placeholder: 'body' });
  txt(s, 'Site: anjos-de-patas.netlify.app\nRepositório: github.com/Anjos-de-Patas/Anjos-de-Patas', { x: 0.6, y: 4.0, w: 5.0, h: 0.7, fontSize: 13, color: 'E8D9C4' });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.85, y: 1.35, w: 2.5, h: 2.95, rectRadius: 0.1, fill: { color: 'FFFFFF' }, line: { color: 'FFFFFF' } });
  s.addImage({ path: 'qr.png', x: 7.05, y: 1.55, w: 2.1, h: 2.1, objectName: 'QR code do site' });
  txt(s, 'Aponte a câmera', { x: 6.85, y: 3.8, w: 2.5, h: 0.35, fontSize: 13, color: HEX.marrom, align: 'center', bold: true });
  s.addNotes('Agradecer e abrir para perguntas. O QR code leva ao site publicado.');

  await pres.writeFile({ fileName: 'Pitch-Anjos-de-Patas.pptx' });
  await applyTheme('Pitch-Anjos-de-Patas.pptx', THEME);
  console.log('ok');
})();
