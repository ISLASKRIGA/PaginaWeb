from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
import shutil

out=Path('output/pdf');out.mkdir(parents=True,exist_ok=True)
target=out/'una-pausa-con-intencion.pdf'
c=canvas.Canvas(str(target),pagesize=(595,842))
c.setTitle('Una pausa con intención | Alma & Tierra')
c.setAuthor('Alma & Tierra')
c.setFillColor(HexColor('#faf9f6'));c.rect(0,0,595,842,fill=1,stroke=0)
c.setFillColor(HexColor('#4e6047'));c.rect(0,650,595,192,fill=1,stroke=0)
c.setFillColor(HexColor('#f8f7eb'));c.setFont('Helvetica',10);c.drawString(48,792,'ALMA & TIERRA  /  UNA GUÍA PARA COMENZAR')
c.setFont('Times-Roman',36);c.drawString(48,736,'Una pausa con intención')
c.setFont('Helvetica',12);c.drawString(48,699,'Tres pequeños ejercicios para hacer espacio para ti.')
c.setFillColor(HexColor('#34412f'))
sections=[('01  Llega a este momento', ['Encuentra una postura cómoda, en una silla o sobre un cojín.', 'Nota los puntos de contacto de tu cuerpo con el lugar donde estás.', 'Puedes mantener los ojos abiertos. No hay una forma perfecta de empezar.']),('02  Observa tres respiraciones',['Siente cómo entra y sale el aire sin forzarlo ni retenerlo.', 'Si te distraes, vuelve con suavidad a la siguiente respiración.', 'No se trata de dejar la mente en blanco, sino de notar y regresar.']),('03  Cierra con amabilidad',['Mira a tu alrededor y reconoce tres cosas que puedes ver.', 'Pregúntate: ¿qué necesito en este momento?', 'Elige un gesto sencillo: tomar agua, estirarte o descansar un poco.'])]
y=600
for title,lines in sections:
 c.setFont('Times-Roman',22);c.drawString(48,y,title);y-=30
 c.setFont('Helvetica',11)
 for line in lines:c.drawString(48,y,line);y-=19
 y-=31
c.setFont('Times-Italic',21);c.drawString(48,236,'¿Qué notaste durante esta pausa?')
c.setStrokeColor(HexColor('#d5d9ca'))
for y in (204,176,148):c.line(48,y,547,y)
c.setFont('Helvetica',9);c.setFillColor(HexColor('#78806d'))
c.drawString(48,91,'Contenido original de muestra. Adapta la práctica a tu comodidad.')
c.drawString(48,75,'Si algo te incomoda, puedes detenerte y continuar con tu día.')
c.drawString(48,40,'ALMA & TIERRA');c.drawRightString(547,40,'1 / 1')
c.save()
Path('public/downloads').mkdir(parents=True,exist_ok=True)
shutil.copyfile(target,'public/downloads/una-pausa-con-intencion.pdf')
try:
 import fitz
 doc=fitz.open(str(target));doc[0].get_pixmap(matrix=fitz.Matrix(1.5,1.5)).save(str(out/'guide-preview.png'))
 print('Created and rendered PDF:',target)
except ImportError:print('Created PDF; renderer unavailable')
