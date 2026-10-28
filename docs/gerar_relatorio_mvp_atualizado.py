"""Gera um relatório independente A4; preserva os PDFs anteriores."""
from pathlib import Path
import sys, json, re
from xml.sax.saxutils import escape
ROOT=Path(__file__).resolve().parents[1]
for folder in ['tmp/pdf-deps','tmp/pdf-v3-deps','tmp/pdf-atual-deps']:
    sys.path.insert(0,str(ROOT/folder))
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER,TA_JUSTIFY,TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import BaseDocTemplate,PageTemplate,Frame,Paragraph,Spacer,PageBreak,Table,TableStyle,Image,KeepTogether
from reportlab.platypus.tableofcontents import TableOfContents
from pypdf import PdfReader

OUT=ROOT/'output/pdf/Relatorio-MVP-TED3-Anjos-de-Patas-atualizado.pdf'
EVID=ROOT/'docs/evidencias/homologacao-real-20261027'
report=json.loads((EVID/'resultado.json').read_text(encoding='utf8'))
assert report['erro'] is None and report['contagens_restauradas']
assert all(r['resultado']=='removido' for r in report['limpeza'])
pdfmetrics.registerFont(TTFont('Arial','C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Bold','C:/Windows/Fonts/arialbd.ttf'))
pdfmetrics.registerFontFamily('Arial',normal='Arial',bold='Arial-Bold',italic='Arial',boldItalic='Arial-Bold')
W,H=A4;LEFT=3*cm;RIGHT=2*cm;TOP=3*cm;BOTTOM=2*cm;WIDTH=W-LEFT-RIGHT
body=ParagraphStyle('Body',fontName='Arial',fontSize=12,leading=18,alignment=TA_JUSTIFY,firstLineIndent=1.25*cm,spaceAfter=9,allowWidows=0,allowOrphans=0)
heading=ParagraphStyle('Heading',parent=body,fontName='Arial-Bold',firstLineIndent=0,spaceAfter=24,keepWithNext=True)
sub=ParagraphStyle('Sub',parent=heading,spaceBefore=18,spaceAfter=12)
center=ParagraphStyle('Center',parent=body,alignment=TA_CENTER,firstLineIndent=0,spaceAfter=12)
boldcenter=ParagraphStyle('BoldCenter',parent=center,fontName='Arial-Bold')
small=ParagraphStyle('Small',parent=body,fontSize=10,leading=12,firstLineIndent=0,alignment=TA_LEFT,spaceAfter=8)
cell=ParagraphStyle('Cell',parent=small,fontSize=10,leading=13,spaceAfter=0)
cellhead=ParagraphStyle('CellHead',parent=cell,fontName='Arial-Bold')
ref=ParagraphStyle('Ref',parent=body,alignment=TA_LEFT,firstLineIndent=0,leading=12,spaceAfter=12,splitLongWords=True)

def p(s,style=body):
    s=escape(s).replace('`','')
    s=re.sub(r'(https?://[^\s]+)',lambda m:f'<link href="{m.group(1)}" color="#000000">{m.group(1)}</link>',s)
    return Paragraph(s,style)

class Report(BaseDocTemplate):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs);self.in_text=False
        self.addPageTemplates(PageTemplate(id='main',frames=[Frame(LEFT,BOTTOM,WIDTH,H-TOP-BOTTOM,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)],onPageEnd=self.page_end))
    def beforeDocument(self):self.in_text=False
    def afterFlowable(self,flowable):
        if isinstance(flowable,Paragraph) and flowable.style.name=='Heading':
            self.in_text=True;title=flowable.getPlainText();key='section-'+str(self.page)
            self.canv.bookmarkPage(key);self.canv.addOutlineEntry(title,key,0,False)
            self.notify('TOCEntry',(0,title,self.page-1,key))
    def page_end(self,canvas,doc):
        if self.in_text:
            canvas.saveState();canvas.setFont('Arial',10);canvas.drawRightString(W-RIGHT,H-2*cm,str(self.page-1));canvas.restoreState()

story=[]
authors=['CARINNE DA SILVA BORGES','JOÃO PEDRO STRASSER SANTOS','JÚLIO CÉSAR LIMA DOS REIS','ROGÉRIO MOTA DE MELO']
title='ANJOS DE PATAS: VERSÃO PARCIAL DO PRODUTO MÍNIMO VIÁVEL'
story.extend([p('UNIBALSAS - CENTRO UNIVERSITÁRIO DE BALSAS',boldcenter),Spacer(1,1.3*cm)])
for name in authors:story.append(p(name,boldcenter))
story.extend([Spacer(1,3.6*cm),p(title,boldcenter),p('TED 3 - Relatório técnico atualizado',center),Spacer(1,6*cm),p('Balsas - MA',center),p('2026',center),PageBreak()])
for name in authors:story.append(p(name,boldcenter))
story.extend([Spacer(1,3*cm),p(title,boldcenter),Spacer(1,2*cm)])
note=ParagraphStyle('Natureza',parent=body,fontSize=12,leading=12,leftIndent=WIDTH/2,firstLineIndent=0)
story.extend([p('Relatório técnico apresentado à disciplina de Programação para Web, do curso de Análise e Desenvolvimento de Sistemas do Centro Universitário UNIBALSAS, como requisito parcial de avaliação.\nProfessor: Marcos David Souza Ramos.',note),Spacer(1,6*cm),p('Balsas - MA',center),p('2026',center),PageBreak()])
story.append(p('RESUMO',boldcenter));story.append(Spacer(1,18))
story.append(p('Este relatório apresenta a versão parcial do Produto Mínimo Viável do portal Anjos de Patas, desenvolvido para apoiar o cadastro e o acompanhamento de animais e adoções. A arquitetura utiliza HTML, CSS e JavaScript na interface, Node.js e Express na API e Supabase para autenticação, PostgreSQL e armazenamento de imagens. A solução implementa catálogo, gestão de animais, históricos, interesse, triagem, adoção transacional e acompanhamento pelo adotante. A avaliação reúne 69 testes automatizados aprovados e 20 cenários de homologação com Auth, banco e Storage reais, executados com dados fictícios. A homologação verificou persistência após reabertura do servidor HTTP, autorização, bloqueio de adoção duplicada, preservação do histórico e isolamento de contas. Foram produzidas sete capturas de tela e removidos os registros temporários. Permanecem pendentes a configuração definitiva de acesso, a entrega real de e-mails, a homologação da integração de inteligência artificial e a publicação em endereço público. Os resultados demonstram evolução técnica e um fluxo operacional funcional, compatível com a proposta de MVP parcial.',ParagraphStyle('ResumoBody',parent=body,firstLineIndent=0)))
story.extend([Spacer(1,18),p('Palavras-chave: proteção animal; adoção responsável; aplicação web; MVP; testes de software.',ref),PageBreak()])
story.append(p('SUMÁRIO',boldcenter));story.append(Spacer(1,18))
toc=TableOfContents();toc.levelStyles=[ParagraphStyle('TOC0',fontName='Arial',fontSize=11,leading=17,leftIndent=0,firstLineIndent=0,spaceBefore=7,rightIndent=18)];toc.dotsMinLevel=0;story.extend([toc,PageBreak()])

text=(ROOT/'docs/Relatorio-MVP-TED3-atualizado.md').read_text(encoding='utf8');lines=text.splitlines();start=next(i for i,s in enumerate(lines) if s.startswith('## '));i=start;first=True;references=False;table_number=0
def table(rows,title):
    global table_number
    table_number+=1
    story.append(p(f'Quadro {table_number} - {title}',small))
    cols=len(rows[0]);ratios={2:[.38,.62],3:[.25,.36,.39],4:[.30,.17,.23,.30]}.get(cols,[1/cols]*cols)
    if cols==4 and 'Prazo' in rows[0]:ratios=[.27,.15,.22,.36]
    data=[[p(s,cellhead if j==0 else cell) for s in row] for j,row in enumerate(rows)]
    t=Table(data,colWidths=[WIDTH*r for r in ratios],repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#eeeeee')),('VALIGN',(0,0),(-1,-1),'TOP'),('LINEABOVE',(0,0),(-1,0),.7,colors.black),('LINEBELOW',(0,0),(-1,0),.7,colors.black),('LINEBELOW',(0,-1),(-1,-1),.7,colors.black),('LINEBELOW',(0,1),(-1,-2),.25,colors.HexColor('#bbbbbb')),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
    story.extend([t,Spacer(1,5),p('Fonte: elaboração da equipe com base no código e nos registros de teste (2026).',small),Spacer(1,12)])

def evidence():
    captions={
        'painel-1440.png':('Painel administrativo após o fluxo de adoção','A interface consulta os indicadores do banco remoto após a adoção fictícia. O animal adotado sai da contagem de acolhidos; a adoção passa a compor o total.'),
        'animais-1440.png':('Histórico preservado após a adoção','A equipe abre o histórico de Mel Teste MVP na interface. Resgate, saúde, vacina, tratamento e adoção permanecem disponíveis após a conclusão.'),
        'interessados-1440.png':('Acompanhamento concluído na gestão de interessados','O interessado fictício aparece na gestão após a adoção. O cadastro e os eventos são persistidos no Supabase, não em uma API simulada.'),
        'adotante-1440.png':('Conclusão consultada pela conta do adotante','A conta autenticada consulta a adoção de Mel Teste MVP e seu histórico de etapas, sem receber as notas internas de atendimento.'),
        'adotante-360.png':('Acompanhamento do adotante em tela de celular','A mesma consulta é apresentada em largura de 360 pixels, sem rolagem horizontal detectada no cenário verificado.'),
        'transparencia-1440.png':('Indicadores públicos durante a homologação','Os totais incluem apenas os dados fictícios existentes no instante do teste. Após a limpeza, as contagens operacionais retornaram aos valores anteriores.'),
        'transparencia-360.png':('Transparência em tela de celular','A página pública apresenta os indicadores em uma coluna e descreve a origem dos números. Zero é exibido como valor válido; falha de consulta não gera estimativa.')}
    for n,capture in enumerate(report['capturas'],1):
        story.append(PageBreak());name=Path(capture['arquivo']).name;title,description=captions[name]
        story.append(p(f'Figura {n} - {title}',small));img=Image(str(ROOT/capture['arquivo']))
        maximum=WIDTH if capture['largura']>500 else 7*cm
        factor=min(maximum/img.imageWidth,16.2*cm/img.imageHeight);img.drawWidth=img.imageWidth*factor;img.drawHeight=img.imageHeight*factor;img.hAlign='CENTER'
        story.extend([img,Spacer(1,8),p('Fonte: captura da aplicação pela equipe, 27 out. 2026. Dados fictícios em serviços remotos reais.',small),p(description,body)])

while i<len(lines):
    line=lines[i].strip()
    if not line:i+=1;continue
    if line.startswith('## '):
        if not first:story.append(PageBreak())
        first=False;title_line=line[3:];references=title_line=='REFERÊNCIAS';story.append(p(title_line,heading));i+=1;continue
    if line.startswith('|'):
        rows=[]
        while i<len(lines) and lines[i].strip().startswith('|'):
            row=[s.strip() for s in lines[i].strip().strip('|').split('|')]
            if not all(re.fullmatch(r':?-+:?',s) for s in row):rows.append(row)
            i+=1
        table(rows,{'Camada':'Componentes da arquitetura','Requisitos':'Requisitos e evidências','Nível':'Níveis de validação','Dificuldade':'Dificuldades e soluções','Atividade':'Plano proposto para conclusão'}.get(rows[0][0],'Síntese técnica'));continue
    if line=='<!-- EVIDENCIAS_REAIS -->':evidence();i+=1;continue
    story.append(p(line,ref if references else body))
    if line.startswith('Os resultados individuais'):
        table([['Cenário remoto','Resultado']]+[[str(n)+'. '+r['cenario'],'Aprovado'] for n,r in enumerate(report['cenarios'],1)],'Cenários da homologação real')
        story.append(p(f'Resultado consolidado: {len(report["cenarios"])} cenários aprovados, {len(report["capturas"])} capturas, sem erro final. Limpeza confirmada para registros, imagem e contas temporárias. O registro estruturado contém {len(report["requisicoes"])} respostas HTTP.',body))
    i+=1

OUT.parent.mkdir(parents=True,exist_ok=True)
doc=Report(str(OUT),pagesize=A4,leftMargin=LEFT,rightMargin=RIGHT,topMargin=TOP,bottomMargin=BOTTOM,title='Anjos de Patas - MVP parcial - TED 3 - revisão de 27/10/2026',author='Carinne da Silva Borges; João Pedro Strasser Santos; Júlio César Lima dos Reis; Rogério Mota de Melo',allowSplitting=1)
doc.multiBuild(story)
r=PdfReader(OUT)
assert all(abs(float(pg.mediabox.width)-W)<1 and abs(float(pg.mediabox.height)-H)<1 for pg in r.pages)
full='\n'.join(pg.extract_text() or '' for pg in r.pages)
for word in ['SUMÁRIO','REFERÊNCIAS','69 testes','20 cenários','PLANEJAMENTO']:
    assert word in full,word
assert 'Placeholder' not in full
print(f'PDF gerado: {OUT}; {len(r.pages)} páginas A4.')
