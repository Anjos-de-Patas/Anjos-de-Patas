"""Gera o PDF da TED 3 (documento técnico versão 3.0) no papel timbrado do curso de ADS.

O conteúdo vem de docs/Relatorio-MVP-TED3-atualizado.md. A apresentação segue o padrão
dos documentos da TED 1 e da TED 2: capa, folha de rosto, seções em sequência, quadros
com cabeçalho vermelho e figuras com legenda e fonte abaixo da imagem.
"""
from pathlib import Path
import json, re
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
                                Table, TableStyle, Image, KeepTogether)
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
FONTE_MD = ROOT / 'docs/Relatorio-MVP-TED3-atualizado.md'
OUT = ROOT / 'output/pdf/Relatorio-MVP-TED3-Anjos-de-Patas-atualizado.pdf'
HOMOLOGACAO = json.loads((ROOT / 'docs/evidencias/homologacao-real-20261027/resultado.json').read_text(encoding='utf8'))
assert HOMOLOGACAO['erro'] is None and HOMOLOGACAO['contagens_restauradas']

pdfmetrics.registerFont(TTFont('Arial', 'C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Bold', 'C:/Windows/Fonts/arialbd.ttf'))
pdfmetrics.registerFontFamily('Arial', normal='Arial', bold='Arial-Bold', italic='Arial', boldItalic='Arial-Bold')

# Página A4: margens de 3 cm à esquerda e 2 cm à direita; topo e base ampliados para o timbrado.
W, H = A4
LEFT, RIGHT, TOP, BOTTOM = 3 * cm, 2 * cm, 4.2 * cm, 2.8 * cm
WIDTH = W - LEFT - RIGHT
VERMELHO = colors.HexColor('#C5524E')  # cor do cabeçalho dos quadros na TED 2

# Papel timbrado do curso de ADS: posições e tamanhos do modelo .docx (cm a partir do topo e da esquerda).
TIMBRADO = ROOT / 'docs/modelos/timbrado-ads'
CABECALHO = (str(TIMBRADO / 'cabecalho.png'), 0.557 * cm, 0.843 * cm, 19.897 * cm, 2.861 * cm)
RODAPE = (str(TIMBRADO / 'rodape.png'), 0.508 * cm, 27.388 * cm, 20.066 * cm, 1.752 * cm)

body = ParagraphStyle('Body', fontName='Arial', fontSize=12, leading=18, alignment=TA_JUSTIFY,
                      firstLineIndent=1.25 * cm, spaceAfter=0, allowWidows=0, allowOrphans=0)
heading = ParagraphStyle('Heading', parent=body, fontName='Arial-Bold', firstLineIndent=0, alignment=TA_LEFT,
                         spaceBefore=14, spaceAfter=4, keepWithNext=True)
subheading = ParagraphStyle('Subheading', parent=heading, spaceBefore=10, spaceAfter=2)
center = ParagraphStyle('Center', parent=body, alignment=TA_CENTER, firstLineIndent=0)
boldcenter = ParagraphStyle('BoldCenter', parent=center, fontName='Arial-Bold')
legenda = ParagraphStyle('Legenda', parent=center, fontName='Arial-Bold', fontSize=10, leading=12, spaceBefore=4)
fonte = ParagraphStyle('Fonte', parent=center, fontSize=10, leading=12, spaceAfter=10)
quadro_titulo = ParagraphStyle('QuadroTitulo', parent=legenda, spaceBefore=6, spaceAfter=0)
cell = ParagraphStyle('Cell', fontName='Arial', fontSize=10, leading=12.5, alignment=TA_LEFT)
cellhead = ParagraphStyle('CellHead', parent=cell, fontName='Arial-Bold', textColor=colors.white, alignment=TA_CENTER)
ref = ParagraphStyle('Ref', parent=body, alignment=TA_LEFT, firstLineIndent=0, leading=12, spaceAfter=12)
natureza = ParagraphStyle('Natureza', parent=body, leading=14, alignment=TA_JUSTIFY, leftIndent=WIDTH / 2, firstLineIndent=0)


def p(texto, style=body):
    texto = escape(texto).replace('`', '')
    texto = re.sub(r'(https?://[^\s]+?)(?=[\s,]|\.\s|\.?$)',
                   lambda m: f'<link href="{m.group(1)}" color="#000000">{m.group(1)}</link>', texto)
    return Paragraph(texto, style)


def timbrado(canvas, doc):
    canvas.saveState()
    for arquivo, x, y, largura, altura in (CABECALHO, RODAPE):
        canvas.drawImage(arquivo, x, H - y - altura, largura, altura, mask='auto')
    canvas.restoreState()


class Relatorio(BaseDocTemplate):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.numerar = False
        frame = Frame(LEFT, BOTTOM, WIDTH, H - TOP - BOTTOM, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates(PageTemplate(id='main', frames=[frame], onPage=timbrado, onPageEnd=self.numero_pagina))

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name in ('Heading', 'Subheading'):
            self.numerar = True
            chave = f'secao-{id(flowable)}'
            self.canv.bookmarkPage(chave)
            self.canv.addOutlineEntry(flowable.getPlainText(), chave, 0 if flowable.style.name == 'Heading' else 1, False)

    def numero_pagina(self, canvas, doc):
        # Folhas pré-textuais são contadas, mas a numeração aparece a partir da introdução.
        if self.numerar:
            canvas.saveState()
            canvas.setFont('Arial', 10)
            canvas.drawRightString(W - RIGHT, H - 2 * cm, str(self.page))
            canvas.restoreState()


contador = {'quadro': 0, 'figura': 0}


def quadro(linhas, titulo, larguras=None):
    """Quadro com título e cabeçalho repetidos nas continuações, para poder quebrar entre páginas."""
    contador['quadro'] += 1
    n = len(linhas[0])
    if larguras is None:
        larguras = {2: [0.36, 0.64], 3: [0.22, 0.43, 0.35]}.get(n, [1 / n] * n)
    titulo_linha = [p(f'Quadro {contador["quadro"]} - {titulo}', quadro_titulo)] + [''] * (n - 1)
    fonte_linha = [p('Fonte: Elaborado pelos autores (2026).', fonte)] + [''] * (n - 1)
    dados = ([titulo_linha, [p(c, cellhead) for c in linhas[0]]] + [[p(c, cell) for c in linha] for linha in linhas[1:]]
             + [fonte_linha])
    tabela = Table(dados, colWidths=[WIDTH * f for f in larguras], repeatRows=2, hAlign='CENTER')
    tabela.setStyle(TableStyle([
        ('SPAN', (0, 0), (-1, 0)), ('SPAN', (0, -1), (-1, -1)),
        ('BACKGROUND', (0, 1), (-1, 1), VERMELHO),
        ('GRID', (0, 1), (-1, -2), 0.5, colors.black),
        ('NOSPLIT', (0, -2), (-1, -1)),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5), ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    return [tabela, Spacer(1, 6)]


def imagem(caminho, largura_max, altura_max):
    img = Image(str(ROOT / caminho))
    fator = min(largura_max / img.imageWidth, altura_max / img.imageHeight)
    img.drawWidth, img.drawHeight = img.imageWidth * fator, img.imageHeight * fator
    img.hAlign = 'CENTER'
    return img


def figura_bloco(titulo, caminho, largura_max, altura_max):
    contador['figura'] += 1
    return [imagem(caminho, largura_max, altura_max), p(f'Figura {contador["figura"]} - {titulo}.', legenda),
            p('Fonte: Elaborado pelos autores (2026).', fonte)]


def figuras(linha):
    itens = re.findall(r'!\[([^\]]+)\]\(([^)]+)\)', linha)
    if len(itens) == 1:
        return [KeepTogether(figura_bloco(itens[0][0], itens[0][1], WIDTH, 9.2 * cm))]
    colunas = [figura_bloco(t, c, WIDTH / len(itens) - 0.6 * cm, 9.4 * cm) for t, c in itens]
    tabela = Table([colunas], colWidths=[WIDTH / len(itens)] * len(itens), hAlign='CENTER')
    tabela.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'BOTTOM'), ('LEFTPADDING', (0, 0), (-1, -1), 0),
                                ('RIGHTPADDING', (0, 0), (-1, -1), 0)]))
    return [tabela]


def pre_textuais():
    autores = ['CARINNE DA SILVA BORGES', 'ROGÉRIO MOTA DE MELO', 'JÚLIO CÉSAR LIMA DOS REIS', 'JOÃO PEDRO STRASSER SANTOS']
    titulo = 'PROJETO DE SOLUÇÃO WEB PARA A ONG ANJOS DE PATAS'
    capa = [p('UNIBALSAS - CENTRO UNIVERSITÁRIO DE BALSAS', boldcenter), Spacer(1, 0.6 * cm)]
    capa += [p(a, boldcenter) for a in autores]
    capa += [Spacer(1, 4.5 * cm), p(titulo, boldcenter), p('Documento Técnico do Projeto - Versão 3.0', center),
             Spacer(1, 7.6 * cm), p('Balsas - MA', center), p('2026', center), PageBreak()]
    rosto = [p(a, boldcenter) for a in autores]
    rosto += [Spacer(1, 4.5 * cm), p(titulo, boldcenter), Spacer(1, 1.5 * cm),
              p('Documento técnico do projeto apresentado à disciplina de Programação para Web, do curso de '
                'Análise e Desenvolvimento de Sistemas do Centro Universitário UNIBALSAS, como requisito '
                'parcial de avaliação da disciplina.', natureza),
              Spacer(1, 0.4 * cm), p('Professor: Marcos David Souza Ramos.', natureza),
              Spacer(1, 7.2 * cm), p('Balsas - MA', center), p('2026', center), PageBreak()]
    return capa + rosto


def cenarios():
    linhas = [['Cenário avaliado', 'Resultado']]
    linhas += [[f'{n}. {c["cenario"]}', 'Aprovado'] for n, c in enumerate(HOMOLOGACAO['cenarios'], 1)]
    return quadro(linhas, 'Cenários da homologação com os serviços reais', [0.78, 0.22])


def corpo():
    linhas = FONTE_MD.read_text(encoding='utf8').splitlines()
    inicio = next(i for i, s in enumerate(linhas) if s.startswith('## '))
    story, i, referencias, titulo_quadro, larguras_quadro = [], inicio, False, None, None
    while i < len(linhas):
        linha = linhas[i].strip()
        if not linha:
            i += 1
            continue
        if linha.startswith('## '):
            referencias = linha[3:] == 'REFERÊNCIAS'
            story.append(p(linha[3:], heading))
        elif linha.startswith('### '):
            story.append(p(linha[4:], subheading))
        elif linha.startswith('<!-- quadro:'):
            # Formato: <!-- quadro: Título | 0.5,0.25,0.25 --> (larguras relativas opcionais)
            titulo_quadro, _, larguras = linha[len('<!-- quadro:'):-3].partition('|')
            titulo_quadro = titulo_quadro.strip()
            larguras_quadro = [float(x) for x in larguras.split(',')] if larguras.strip() else None
        elif linha == '<!-- CENARIOS -->':
            story += cenarios()
        elif linha.startswith('!['):
            story += figuras(linha)
        elif linha.startswith('|'):
            tabela = []
            while i < len(linhas) and linhas[i].strip().startswith('|'):
                celulas = [s.strip() for s in linhas[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-+:?', s) for s in celulas):
                    tabela.append(celulas)
                i += 1
            assert titulo_quadro, f'quadro sem título antes da linha {i}'
            story += quadro(tabela, titulo_quadro, larguras_quadro)
            titulo_quadro = None
            continue
        else:
            story.append(p(linha, ref if referencias else body))
        i += 1
    return story


OUT.parent.mkdir(parents=True, exist_ok=True)
doc = Relatorio(str(OUT), pagesize=A4, leftMargin=LEFT, rightMargin=RIGHT, topMargin=TOP, bottomMargin=BOTTOM,
                title='Projeto de Solução Web para a ONG Anjos de Patas - Documento Técnico Versão 3.0',
                subject='TED 3 - Programação para Web',
                author='Carinne da Silva Borges; Rogério Mota de Melo; Júlio César Lima dos Reis; João Pedro Strasser Santos')
doc.build(pre_textuais() + corpo())

leitor = PdfReader(OUT)
assert all(abs(float(pg.mediabox.width) - W) < 1 and abs(float(pg.mediabox.height) - H) < 1 for pg in leitor.pages)
texto = '\n'.join(pg.extract_text() or '' for pg in leitor.pages)
for termo in ['1 INTRODUÇÃO', '2 IDENTIFICAÇÃO DA EQUIPE', '3 ARQUITETURA', '4 FUNCIONALIDADES', '5 EVIDÊNCIAS',
              '6 RESULTADOS', '7 DIFICULDADES', '8 PLANEJAMENTO', 'REFERÊNCIAS', '99 testes', 'anjos-de-patas.netlify.app']:
    assert termo in texto, termo
print(f'PDF gerado: {OUT}; {len(leitor.pages)} páginas A4; {contador["quadro"]} quadros; {contador["figura"]} figuras.')
