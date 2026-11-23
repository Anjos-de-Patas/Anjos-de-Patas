"""Manual simplificado do usuário da aplicação Anjos de Patas (entrega da TED 4).

Gera output/pdf/Manual-do-Usuario-Anjos-de-Patas.pdf com o mesmo cabeçalho do Documento Técnico.
As imagens ficam em docs/manual/img: capturas das evidências versionadas e quadros dos vídeos tutoriais.
Uso: python docs/gerar_documento_v4.py (gera o cabeçalho em tmp/) e depois python docs/gerar_manual_usuario.py. Dependências: reportlab
"""
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER, TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Image, KeepTogether, PageBreak,
                                Table, TableStyle, ListFlowable, ListItem)

ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / 'docs/manual/img'
HEADER = ROOT / 'tmp/pdfs/v4/cabecalho-unibalsas.png'
OUT = ROOT / 'output/pdf/Manual-do-Usuario-Anjos-de-Patas.pdf'

def fonte(*c):
    return next(x for x in c if Path(x).exists())
pdfmetrics.registerFont(TTFont('Arial', fonte('C:/Windows/Fonts/arial.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf')))
pdfmetrics.registerFont(TTFont('ArialB', fonte('C:/Windows/Fonts/arialbd.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf')))

MARROM = colors.HexColor('#52392c'); DOURADO = colors.HexColor('#edc785'); BEGE = colors.HexColor('#f8efe2'); VERMELHO = colors.HexColor('#c0504d')
S = {
 'titulo': ParagraphStyle('t', fontName='ArialB', fontSize=24, leading=30, alignment=TA_CENTER, textColor=MARROM),
 'sub': ParagraphStyle('s', fontName='Arial', fontSize=13, leading=18, alignment=TA_CENTER, textColor=colors.HexColor('#715d4d')),
 'parte': ParagraphStyle('p', fontName='ArialB', fontSize=16, leading=20, spaceBefore=4, spaceAfter=10, textColor=MARROM),
 'secao': ParagraphStyle('h', fontName='ArialB', fontSize=13, leading=16, spaceBefore=14, spaceAfter=8, keepWithNext=True),
 'corpo': ParagraphStyle('c', fontName='Arial', fontSize=11.5, leading=17, alignment=TA_JUSTIFY, spaceAfter=6),
 'passo': ParagraphStyle('ps', fontName='Arial', fontSize=11.5, leading=16, alignment=TA_LEFT),
 'leg': ParagraphStyle('l', fontName='ArialB', fontSize=9.5, leading=12, alignment=TA_CENTER, spaceBefore=4),
 'fonte': ParagraphStyle('f', fontName='Arial', fontSize=9, leading=11, alignment=TA_CENTER, spaceAfter=10),
 'dica': ParagraphStyle('d', fontName='Arial', fontSize=10.5, leading=15, textColor=colors.HexColor('#5b4330')),
 'cel': ParagraphStyle('ce', fontName='Arial', fontSize=10.5, leading=14),
 'celh': ParagraphStyle('ch', fontName='ArialB', fontSize=10.5, leading=14, textColor=colors.white),
}
PAGE_W, PAGE_H = 612, 792
LEFT, RIGHT = 85.04, 56.69
WIDTH = PAGE_W - LEFT - RIGHT
fig = 0

def P(t, s='corpo'): return Paragraph(t, S[s])
def passos(itens):
    return ListFlowable([ListItem(P(t, 'passo'), leftIndent=18, value=i + 1) for i, t in enumerate(itens)],
                        bulletType='1', bulletFontName='ArialB', bulletFontSize=11, leftIndent=18, spaceBefore=2)
def dica(t):
    tb = Table([[P('<b>Dica:</b> ' + t, 'dica')]], colWidths=[WIDTH])
    tb.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), BEGE), ('LEFTPADDING', (0, 0), (-1, -1), 10),
                            ('RIGHTPADDING', (0, 0), (-1, -1), 10), ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
                            ('LINEBEFORE', (0, 0), (0, -1), 3, DOURADO)]))
    return tb
def figura(nome, legenda, max_h=205, fonte='Captura da aplicação publicada (2026).'):
    global fig
    fig += 1
    im = Image(str(IMG / nome))
    f = min(WIDTH / im.imageWidth, max_h / im.imageHeight)
    im.drawWidth, im.drawHeight = im.imageWidth * f, im.imageHeight * f
    return KeepTogether([Spacer(1, 4), im, P(f'Figura {fig} - {legenda}', 'leg'), P('Fonte: ' + fonte, 'fonte')])
VIDEO = 'Quadro do vídeo tutorial da equipe (2026).'

def secao(titulo, intro, etapas, img=None, legenda='', fonte_img=None, extra=None, max_h=205):
    bloco = [P(titulo, 'secao')]
    if intro: bloco.append(P(intro))
    if etapas: bloco.append(passos(etapas))
    out = [KeepTogether(bloco)]
    if img: out.append(figura(img, legenda, max_h, fonte_img or 'Captura da aplicação publicada (2026).'))
    if extra: out += [extra, Spacer(1, 6)]
    return out

story = []
# Capa
story += [Spacer(1, 70), P('MANUAL SIMPLIFICADO DO USUÁRIO', 'titulo'), Spacer(1, 6),
          P('Plataforma web da ONG Anjos de Patas', 'sub'), Spacer(1, 4),
          P('Adoção responsável de cães e gatos em Balsas - MA', 'sub'), Spacer(1, 34)]
im = Image(str(IMG / 'p_inicio.png')); f = WIDTH / im.imageWidth; im.drawWidth, im.drawHeight = WIDTH, im.imageHeight * f
story += [im, Spacer(1, 30)]
capa = Table([[P('<b>Site:</b> https://anjos-de-patas.netlify.app', 'cel')],
              [P('<b>Área da equipe:</b> https://anjos-de-patas.netlify.app/pages/login', 'cel')],
              [P('<b>Equipe:</b> Carinne da Silva Borges, Rogério Mota de Melo, Júlio Cesar Lima dos Reis e João Pedro Strasser Santos', 'cel')],
              [P('<b>Curso:</b> Análise e Desenvolvimento de Sistemas - UNIBALSAS - 2026', 'cel')]], colWidths=[WIDTH])
capa.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), BEGE), ('LEFTPADDING', (0, 0), (-1, -1), 12), ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6)]))
story += [capa, PageBreak()]

# Apresentação
story += [P('1 APRESENTAÇÃO', 'parte'),
 P('A plataforma da Anjos de Patas reúne, em um só lugar, os animais disponíveis para adoção, o histórico de cuidados de cada animal e o acompanhamento dos pedidos de adoção. Ela funciona no navegador do computador, do tablet ou do celular, sem instalar nenhum programa.'),
 P('Este manual está dividido em duas partes:'),
 passos(['<b>Parte A - Para quem quer adotar:</b> conhecer os animais, manifestar interesse, conversar com o assistente e acompanhar o pedido.',
         '<b>Parte B - Para a equipe da ONG:</b> entrar no sistema, cadastrar animais, registrar cuidados e resgates, acompanhar interessados e registrar adoções.']),
 Spacer(1, 8)]
tab = Table([[P('Quem usa', 'celh'), P('Onde acessa', 'celh'), P('Precisa de conta?', 'celh')],
             [P('Pessoa interessada em adotar', 'cel'), P('Página inicial do site', 'cel'), P('Não para consultar; sim para acompanhar o pedido', 'cel')],
             [P('Responsável ou voluntário da ONG', 'cel'), P('Área administrativa (/pages/login)', 'cel'), P('Sim, criada pela coordenação', 'cel')]],
            colWidths=[WIDTH * .34, WIDTH * .33, WIDTH * .33])
tab.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), VERMELHO), ('GRID', (0, 0), (-1, -1), .5, colors.HexColor('#bfbfbf')),
                         ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5)]))
story += [tab, Spacer(1, 10),
 dica('a equipe também gravou dois vídeos tutoriais, um para o público e outro para a equipe da ONG, que mostram estes mesmos passos em funcionamento. Os links estão no README do repositório.'),
 PageBreak()]

# Parte A
story.append(P('PARTE A - PARA QUEM QUER ADOTAR', 'parte'))
story += secao('A1 Conhecer os animais disponíveis',
  'Na página inicial, clique em <b>Consultar animais disponíveis</b> ou em <b>Adote</b> no menu.',
  ['Use os filtros de <b>Espécie</b> (Cachorros ou Gatos) e de <b>Sexo</b> (Fêmeas ou Machos). O texto abaixo dos filtros mostra o que está sendo exibido.',
   'Para ver todos de novo, selecione <b>Todos</b> nos dois filtros ou clique em <b>Limpar filtros</b>.',
   'Em cada card, clique em <b>Ver detalhes</b> para ver temperamento e convivência, ou em <b>Ver perfil completo</b>.'],
  'p_catalogo.png', 'Seção Adote com filtros e cards dos animais (dados fictícios de teste).')
story += secao('A2 Ver o perfil completo do animal',
  'O perfil mostra espécie, sexo, porte, faixa etária e se o animal convive com crianças e outros animais. Logo abaixo há orientações para uma decisão responsável: saúde e cuidados, adaptação ao novo lar e compromisso de longo prazo.',
  None, 'p_perfil.png', 'Perfil do animal com o botão Manifestar interesse.')
story += secao('A3 Manifestar interesse',
  None,
  ['No perfil do animal, clique em <b>Manifestar interesse</b>.',
   'Preencha nome completo, e-mail, telefone com DDD, cidade e estado.',
   'Se quiser, conte sobre sua rotina e o lar que pode oferecer.',
   'Marque a autorização de uso dos dados e clique em <b>Enviar manifestação de interesse</b>.'],
  'p_form.png', 'Formulário de manifestação de interesse.', VIDEO,
  dica('o envio não reserva o animal e não tem nenhuma cobrança. Ele inicia a triagem: a equipe avalia o pedido e entra em contato.'))
story += secao('A4 Conversar com o assistente Anjos IA',
  'Se não souber por onde começar, clique no botão <b>Anjos IA</b>, no canto da tela. O assistente faz uma pergunta de cada vez sobre sua rotina e suas preferências e, no final, recomenda animais que combinam com o seu perfil, com link para cada um.',
  None, 'p_ia.png', 'Assistente Anjos IA recomendando um animal.', VIDEO,
  dica('o assistente não pede dados pessoais e não envia pedidos. Para adotar, use sempre o botão Manifestar interesse no perfil do animal.'), max_h=240)
story += secao('A5 Criar conta e acompanhar o pedido',
  None,
  ['Clique em <b>Entrar</b>, no topo do site, e depois em <b>Criar conta de adotante</b>.',
   'Use o <b>mesmo e-mail</b> informado na manifestação de interesse e crie uma senha com pelo menos 8 caracteres.',
   'Confirme o e-mail recebido e entre na sua conta.',
   'Em <b>Minha conta</b>, veja a etapa atual do pedido (interesse recebido, triagem, entrevista, cadastro aprovado e adoção concluída) e o histórico com datas.'],
  'p_adotante.png', 'Área do adotante com as etapas do pedido.', 'Captura da homologação (2026).')
story += secao('A6 Tirar dúvidas e consultar a transparência',
  'Em <b>Dúvidas</b>, clique em uma pergunta para ver a resposta. Em <b>Transparência</b>, acompanhe os indicadores da ONG calculados pelo sistema.',
  None, 'p_faq.png', 'Página de perguntas frequentes.')
story.append(PageBreak())

# Parte B
story.append(P('PARTE B - PARA A EQUIPE DA ONG', 'parte'))
story += secao('B1 Entrar no sistema',
  None,
  ['Acesse https://anjos-de-patas.netlify.app/pages/login (ou o link Área administrativa, no rodapé do site).',
   'Informe e-mail e senha e clique em <b>Entrar</b>. Se esquecer a senha, use <b>Esqueci minha senha</b> e siga o código enviado por e-mail.'],
  'a_login.png', 'Tela de acesso da área administrativa.', max_h=165)
story += secao('B2 Visão geral',
  'Depois do login, a <b>Visão geral</b> mostra os indicadores principais (animais acolhidos, adoções concluídas, animais sob cuidados médicos e pedidos pendentes) e atalhos para as tarefas mais comuns. O menu lateral leva às demais áreas; no rodapé ficam o seu perfil e o botão <b>Sair</b>.',
  None, 'a_painel.png', 'Visão geral da área administrativa.', VIDEO)
story += secao('B3 Cadastrar um animal',
  None,
  ['Clique em <b>Cadastrar animal</b> (atalho da visão geral ou página Animais).',
   'Primeiro adicione uma foto (JPG, PNG ou WebP).',
   'Preencha nome, espécie, sexo, porte, faixa etária, temperamento e a situação: <b>em tratamento</b>, <b>disponível para adoção</b> ou <b>adotado</b>.',
   'Marque se o animal convive com crianças e com outros animais e clique em <b>Salvar animal</b>.'],
  'a_dados.png', 'Formulário de cadastro do animal.', VIDEO,
  dica('somente animais com a situação "disponível para adoção" aparecem no site para o público.'))
story += secao('B4 Pesquisar, editar e registrar o histórico',
  None,
  ['Na página <b>Animais</b>, pesquise pelo nome ou filtre pela situação.',
   'Clique em <b>Editar</b> para alterar os dados ou em <b>Histórico</b> para ver resgates, saúde, vacinas, tratamentos e adoções.',
   'Para incluir um registro, escolha o tipo (por exemplo, Vacina), preencha os campos e clique em <b>Salvar registro</b>. O novo registro entra no histórico na mesma hora.'],
  'a_registro.png', 'Inclusão de um registro de vacina no histórico do animal.', VIDEO)
story += secao('B5 Registrar um resgate',
  'Na página <b>Resgates</b>, selecione o animal (ou cadastre um novo), confira a data, informe o local e o motivo do resgate e clique em <b>Registrar resgate</b>. O registro aparece na lista e também no histórico do animal.',
  None, 'a_resgate.png', 'Registro de resgate.', VIDEO)
story += secao('B6 Acompanhar os interessados',
  None,
  ['Em <b>Interessados</b>, pesquise por nome, e-mail, telefone ou animal, ou filtre pela etapa do processo.',
   'Abra <b>Gerenciar</b> no cadastro da pessoa para ver o animal de interesse, a cidade e a mensagem enviada.',
   'Altere a etapa (triagem, entrevista, cadastro aprovado) e escolha se a anotação é uma nota interna ou um registro de contato.',
   'Use <b>Consultar histórico</b> para ver todas as mudanças, com data e hora.'],
  'a_etapa.png', 'Gestão de um interessado: etapa e anotação.', VIDEO,
  dica('notas e contatos ficam visíveis apenas para a equipe. O adotante vê somente a etapa atual do pedido.'))
story += secao('B7 Registrar a adoção',
  None,
  ['Em <b>Adoções</b>, selecione o adotante aprovado. O animal de interesse já vem selecionado; se a adoção for de outro animal, basta trocar.',
   'Confira a data, acrescente observações (por exemplo, termo assinado e retorno agendado) e clique em <b>Registrar adoção</b>.',
   'A situação do animal muda para <b>adotado</b>, ele sai da seção Adote do site e todo o histórico continua disponível. As adoções concluídas ficam listadas logo abaixo.'],
  'a_adocao.png', 'Registro da adoção com o animal de interesse já selecionado.', VIDEO)
story += [P('B8 Boas práticas', 'secao'),
  passos(['Mantenha os dados dos animais atualizados: situação, foto e histórico.',
          'Registre cada contato e cada mudança de etapa no acompanhamento dos interessados.',
          'Proteja os dados pessoais: não compartilhe informações dos interessados fora do sistema.',
          'Ao terminar, clique sempre em <b>Sair</b>, principalmente em computadores compartilhados.']),
  Spacer(1, 10), P('PROBLEMAS COMUNS', 'secao')]
tp = Table([[P('Situação', 'celh'), P('O que fazer', 'celh')],
            [P('O animal não aparece no site', 'cel'), P('Confira se a situação está como "disponível para adoção".', 'cel')],
            [P('Não consigo entrar na área da equipe', 'cel'), P('Use "Esqueci minha senha". Se o perfil estiver inativo, fale com a coordenação.', 'cel')],
            [P('O adotante não vê o pedido na conta', 'cel'), P('A conta precisa usar o mesmo e-mail informado no formulário de interesse.', 'cel')],
            [P('Não consigo registrar a adoção', 'cel'), P('O interessado precisa estar com o cadastro aprovado e o animal, disponível.', 'cel')],
            [P('O assistente responde em "modo guiado"', 'cel'), P('A IA está temporariamente indisponível; o assistente continua consultando os animais cadastrados.', 'cel')]],
           colWidths=[WIDTH * .38, WIDTH * .62])
tp.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), VERMELHO), ('GRID', (0, 0), (-1, -1), .5, colors.HexColor('#bfbfbf')),
                        ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5)]))
story.append(tp)

def cabecalho(c, doc):
    c.drawImage(str(HEADER), 0, PAGE_H - 75, width=PAGE_W, height=75)
    if doc.page > 1:
        c.setFont('Arial', 9); c.setFillColor(colors.HexColor('#715d4d'))
        c.drawRightString(PAGE_W - RIGHT, 30, f'Manual do Usuário - Anjos de Patas  |  {doc.page}')

OUT.parent.mkdir(parents=True, exist_ok=True)
SimpleDocTemplate(str(OUT), pagesize=(PAGE_W, PAGE_H), leftMargin=LEFT, rightMargin=RIGHT, topMargin=95, bottomMargin=56.69,
                  title='Manual Simplificado do Usuário - Anjos de Patas', author='Equipe Anjos de Patas').build(story, onFirstPage=cabecalho, onLaterPages=cabecalho)
print('Manual gerado:', OUT, '| figuras:', fig)
