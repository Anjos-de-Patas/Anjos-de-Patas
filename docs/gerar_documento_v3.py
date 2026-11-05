"""Documento Técnico do Projeto - Versão 3.0, no padrão visual do documento oficial da TED 2.

Mantém integralmente as seções 1-19 da versão 2.0 (que incorpora a TED 1), atualiza a
capa para a versão 3.0 e acrescenta as seções 20-31 da TED 3, escritas em docs/TED3-complemento.md.
Uso: python docs/gerar_documento_v3.py
Dependências: reportlab, pypdf e pypdfium2.
"""
from pathlib import Path
from io import BytesIO
import re
import sys
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
for folder in ['tmp/pdf-deps', 'tmp/pdf-v3-deps']:
    if (ROOT / folder).exists():
        sys.path.insert(0, str(ROOT / folder))

from pypdf import PdfReader, PdfWriter
import pypdfium2 as pdfium
from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, CondPageBreak, Image, KeepTogether

OUT = ROOT / 'output/pdf'
TMP = ROOT / 'tmp/pdfs/v3'
OUT.mkdir(parents=True, exist_ok=True)
TMP.mkdir(parents=True, exist_ok=True)
source = next(ROOT.glob('TED2*.pdf'))
reader = PdfReader(source)
reference = pdfium.PdfDocument(str(source))
size = tuple(float(n) for n in reader.pages[0].mediabox[2:])
header = TMP / 'cabecalho-unibalsas.png'
reference[0].render(scale=2).to_pil().crop((0, 0, int(size[0]*2), 150)).save(header)

pdfmetrics.registerFont(TTFont('ArialProjeto', 'C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('ArialProjetoBold', 'C:/Windows/Fonts/arialbd.ttf'))
styles = getSampleStyleSheet()
styles.add(ParagraphStyle('Corpo', fontName='ArialProjeto', fontSize=12,
    leading=20.7, alignment=TA_JUSTIFY, firstLineIndent=35.4,
    spaceAfter=6, allowWidows=0, allowOrphans=0))
styles.add(ParagraphStyle('Secao', fontName='ArialProjetoBold', fontSize=12,
    leading=15, spaceBefore=14, spaceAfter=10, keepWithNext=True))
styles.add(ParagraphStyle('Celula', fontName='ArialProjeto', fontSize=12,
    leading=13.8))
styles.add(ParagraphStyle('Legenda', fontName='ArialProjetoBold', fontSize=10,
    leading=12, alignment=TA_CENTER, spaceBefore=4))
styles.add(ParagraphStyle('Fonte', fontName='ArialProjeto', fontSize=10,
    leading=12, alignment=TA_CENTER, spaceAfter=12))
styles.add(ParagraphStyle('Cabecalho', fontName='ArialProjetoBold', fontSize=12,
    leading=13.8, alignment=TA_CENTER, textColor=colors.white))

styles.add(ParagraphStyle('CorpoEsquerda', parent=styles['Corpo'], alignment=0, splitLongWords=True))

def par(text, style='Corpo'):
    # Parágrafos com endereços ou caminhos longos ficam alinhados à esquerda para evitar espaços excessivos.
    if style == 'Corpo' and re.search(r'https?://|docs/evidencias/', text):
        style = 'CorpoEsquerda'
    return Paragraph(escape(text), styles[style])

text = (ROOT / 'docs/TED3-complemento.md').read_text(encoding='utf-8')
text = text[text.index('## 1 Finalidade'):]
# As seções da TED 3 continuam a numeração da versão 2.0 (seções 1 a 19).
text = re.sub(r'^## (\d+) (.+)$', lambda m: f'## {int(m[1])+19} {m[2]}', text, flags=re.M)
(TMP / 'conteudo-v3.md').write_text(text, encoding='utf-8')

story = []
lines = text.splitlines()
i = 0
figuras = 0  # a versão 2.0 termina na Figura 16
left, right = 85.04, 56.69
width = size[0] - left - right
while i < len(lines):
    line = lines[i].strip()
    if not line:
        i += 1
        continue
    if line.startswith('|'):
        rows = []
        while i < len(lines) and lines[i].strip().startswith('|'):
            cells = [c.strip() for c in lines[i].strip().strip('|').split('|')]
            if not all(re.fullmatch(r':?-+:?', c) for c in cells):
                rows.append([par(c.upper() if not rows else c,
                    'Cabecalho' if not rows else 'Celula') for c in cells])
            i += 1
        table = Table(rows, colWidths=[width*.34, width*.66], repeatRows=1, hAlign='LEFT')
        table.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,0),colors.HexColor('#c0504d')),
            ('VALIGN',(0,0),(-1,-1),'TOP'),
            ('GRID',(0,0),(-1,-1),.5,colors.black),
            ('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),
            ('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),
        ]))
        if not (story and isinstance(story[-1], Paragraph) and story[-1].style.name == 'Secao'):
            story.append(CondPageBreak(150))
        story.extend([table, Spacer(1,10)])
        continue
    if line.startswith('!['):
        legenda, caminho = re.fullmatch(r'!\[([^\]]+)\]\(([^)]+)\)', line).groups()
        figuras += 1
        img = Image(str(ROOT / caminho))
        fator = min(width / img.imageWidth, 300 / img.imageHeight)
        img.drawWidth, img.drawHeight = img.imageWidth * fator, img.imageHeight * fator
        story.append(KeepTogether([img, par(f'Figura {16 + figuras} - {legenda}.', 'Legenda'),
                                   par('Fonte: Elaborado pelos autores (2026).', 'Fonte')]))
        i += 1
        continue
    if line.startswith('## '):
        story.append(par(line[3:].upper(), 'Secao'))
    else:
        story.append(par(line))
    i += 1

def page_header(canvas, doc):
    canvas.drawImage(str(header), 0, size[1]-75, width=size[0], height=75)

supplement = TMP / 'secoes-ted3.pdf'
SimpleDocTemplate(str(supplement), pagesize=size, leftMargin=left, rightMargin=right,
    topMargin=85.04, bottomMargin=56.69,
    title='Documento Técnico do Projeto - Versão 3.0', author='Equipe Anjos de Patas'
).build(story, onFirstPage=page_header, onLaterPages=page_header)

# Atualiza apenas o algarismo da versão na capa original, preservando seu desenho.
textpage = reference[0].get_textpage()
covertext = textpage.get_text_range()
index = covertext.index('2.0')
x0, y0, x1, y1 = textpage.get_charbox(index)
overlay_bytes = BytesIO()
overlay = Canvas(overlay_bytes, pagesize=size)
overlay.setFillColor(colors.white)
overlay.rect(x0-1, y0-1, x1-x0+2, y1-y0+2, fill=1, stroke=0)
overlay.setFillColor(colors.black)
overlay.setFont('ArialProjeto', 12)
overlay.drawString(x0-.75, y0-.12, '3')
overlay.save()
overlay_bytes.seek(0)

writer = PdfWriter()
writer.append(reader, import_outline=False)
writer.pages[0].merge_page(PdfReader(overlay_bytes).pages[0])
writer.add_outline_item('Capa - versão 3.0',0)
writer.add_outline_item('Conteúdo das etapas anteriores - seções 1 a 19',2)
writer.append(str(supplement), import_outline=False)
writer.add_outline_item('TED 3 - seções 20 a 31',len(reader.pages))
writer.add_metadata({'/Title':'Projeto de Solução Web para a ONG Anjos de Patas - Documento Técnico - Versão 3.0',
    '/Author':'Equipe Anjos de Patas','/Subject':'TED 3 - Desenvolvimento do back-end, persistência e integração'})
final = OUT / 'Documento-Tecnico-Anjos-de-Patas-v3.pdf'
with final.open('wb') as stream:
    writer.write(stream)
result = PdfReader(final)
for idx in range(1,len(reader.pages)):
    assert reader.pages[idx].extract_text() == result.pages[idx].extract_text()
    assert reader.pages[idx].get_contents().get_data() == result.pages[idx].get_contents().get_data()
assert '20 FINALIDADE' in result.pages[len(reader.pages)].extract_text()
print(f'Documento 3.0: {len(result.pages)} páginas; conteúdo anterior preservado e {len(result.pages)-len(reader.pages)} páginas novas no mesmo padrão.')
