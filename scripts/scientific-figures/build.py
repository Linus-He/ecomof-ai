"""Generate reviewed connectivity depictions and explicitly labelled teaching schematics.
Run with the pinned requirements; no runtime chemistry dependency or network request.
"""
import hashlib,json,math,pathlib
from html import escape
from rdkit import Chem
from rdkit.Chem import rdDepictor,rdMolDescriptors,AllChem
from rdkit.Chem.Draw import rdMolDraw2D
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'public/images/scientific-structures';OUT.mkdir(parents=True,exist_ok=True)
records=json.loads((ROOT/'scripts/scientific-figures/pubchem-records.json').read_text())
metadata={}
C=lambda a,b:[a,b]
def save(key,svg,title,caption,sources,kind,**extra):
 p=OUT/(key+'.svg');p.write_text(svg)
 metadata[key]=dict(id=key,image='images/scientific-structures/'+p.name,title=title,caption=caption,sources=sources,kind=kind,sha256=hashlib.sha256(svg.encode()).hexdigest(),**extra)
def molecule(key,smiles,title,source,formula=None,cip=None):
 m=Chem.MolFromSmiles(smiles)
 if not m:raise ValueError(key)
 calculated=rdMolDescriptors.CalcMolFormula(m)
 if formula and calculated!=formula:raise ValueError('Formula mismatch '+key)
 centers=Chem.FindMolChiralCenters(m,includeUnassigned=True)
 if cip and [x[1] for x in centers]!=[cip]:raise ValueError('Incorrect CIP '+key)
 rdDepictor.Compute2DCoords(m)
 d=rdMolDraw2D.MolDraw2DSVG(520,340);o=d.drawOptions();o.addStereoAnnotation=True;o.bondLineWidth=2;o.padding=.14;o.minFontSize=15;o.maxFontSize=25
 d.DrawMolecule(m,highlightAtoms=[x[0] for x in centers] if cip else [],highlightAtomColors={x[0]:(.83,.92,.95) for x in centers} if cip else {})
 d.FinishDrawing()
 save(key,d.GetDrawingText(),title,C('按公开连接与立体化学记录绘制的二维结构式；楔线表示空间构型，不表示旋光方向。' if cip else '按公开分子记录绘制的二维连接结构；二维布局不代表实验测得的三维构象。','2D depiction from recorded connectivity and stereochemistry; wedges indicate configuration, not optical rotation.' if cip else '2D depiction of recorded connectivity, not a measured 3D conformation.'),[dict(label='PubChem',url=source)],'molecular',smiles=Chem.MolToSmiles(m,isomericSmiles=True),formula=calculated,chiralCenters=centers)
names={'carvone-r':C('(R)-香芹酮','(R)-Carvone'),'carvone-s':C('(S)-香芹酮','(S)-Carvone'),'limonene':C('柠檬烯（未指定构型）','Limonene (unspecified stereochemistry)'),'cholesterol':C('胆固醇','Cholesterol'),'sucrose':C('蔗糖','Sucrose'),'ascorbic-acid':C('抗坏血酸（维生素 C）','Ascorbic acid (vitamin C)'),'glucose':C('葡萄糖记录（异头位未指定）','Glucose record (anomer unspecified)'),'glycine':C('甘氨酸','Glycine'),'alanine':C('L-丙氨酸','L-Alanine'),'adenosine-monophosphate':C('腺苷单磷酸（AMP）','Adenosine monophosphate (AMP)'),'atp':C('ATP（记录中的酸形式）','ATP (recorded acid form)'),'benzene':C('苯','Benzene'),'ethanol':C('乙醇','Ethanol'),'cyclohexane':C('环己烷连接结构','Cyclohexane connectivity'),'fullerene':C('C₆₀ 富勒烯','C₆₀ fullerene'),'indigo':C('靛蓝（所引记录的互变异构形式）','Indigo (tautomer in cited record)'),'ethylene':C('乙烯','Ethene'),'deoxy-amp':C('脱氧腺苷单磷酸（dAMP）','Deoxyadenosine monophosphate (dAMP)'),'triazole':C('1,2,3-三唑骨架','1,2,3-Triazole scaffold')}
for key,r in records.items():molecule(key,r.get('SMILES',r.get('IsomericSMILES')),names[key],f'https://pubchem.ncbi.nlm.nih.gov/compound/{r["cid"]}',r['MolecularFormula'], 'R' if key=='carvone-r' else 'S' if key=='carvone-s' else None)
# Additional elementary graph depictions have explicit formulas and no inferred stereocentres.
for key,smi,title,formula,source in [
 ('sodium-fluoride','[Na+].[F-]',C('氟化钠的离子表示','Sodium fluoride: ionic representation'),'FNa','https://pubchem.ncbi.nlm.nih.gov/compound/5235'),
 ('ammonia','N',C('氨','Ammonia'),'H3N','https://pubchem.ncbi.nlm.nih.gov/compound/222'),
 ('carbon-dioxide','O=C=O',C('二氧化碳','Carbon dioxide'),'CO2','https://pubchem.ncbi.nlm.nih.gov/compound/280'),
 ('dimethyl-ether','COC',C('二甲醚','Dimethyl ether'),'C2H6O','https://pubchem.ncbi.nlm.nih.gov/compound/8254'),
 ('peptide','NCC(=O)N[C@@H](C)C(=O)O',C('甘氨酰-L-丙氨酸：肽键实例','Glycyl-L-alanine: a peptide bond'),'C5H10N2O3','https://goldbook.iupac.org/terms/view/P04479'),
 ('octadiene','C=CCCCCC=C',C('1,7-辛二烯：闭环复分解底物示例','1,7-Octadiene: a ring-closing substrate'),'C8H14','https://www.nobelprize.org/prizes/chemistry/2005/advanced-information/'),
 ('cyclohexene','C1=CCCCC1',C('环己烯：六元环烯烃','Cyclohexene: a six-membered alkene'),'C6H10','https://pubchem.ncbi.nlm.nih.gov/compound/8079'),
 ('ozone','[O-][O+]=O',C('臭氧：一个形式电荷共振式','Ozone: one formal-charge resonance contributor'),'O3','https://pubchem.ncbi.nlm.nih.gov/compound/Ozone'),
 ('tert-butyl-cation','C[C+](C)C',C('叔丁基碳正离子','tert-Butyl cation'),'C4H9+','https://goldbook.iupac.org/terms/view/C00812')]:molecule(key,smi,title,source,formula)
# SVG primitives: these drawings encode topology/roles only, never experimental coordinates.
def text(x,y,t,size=16,color='#153d50',anchor='middle'):return f'<text x="{x}" y="{y}" text-anchor="{anchor}" fill="{color}" font-size="{size}" font-family="Arial,PingFang SC,sans-serif">{escape(str(t))}</text>'
def line(x,y,a,b,color='#3b687d',dash=False):return f'<line x1="{x}" y1="{y}" x2="{a}" y2="{b}" stroke="{color}" stroke-width="2"'+(' stroke-dasharray="5 5"' if dash else '')+'/>'
def circle(x,y,r=12,fill='#e3edf3',stroke='#3b687d'):return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>'
def path(d,color='#3b687d',width=2,fill='none'):return f'<path d="{d}" stroke="{color}" stroke-width="{width}" fill="{fill}"/>'
def arrow(x,y,a,b):return line(x,y,a,b)+path(f'M {a-8} {b-5} L {a} {b} L {a-8} {b+5}')
def shell(body):return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 300"><rect width="680" height="300" fill="#fff"/>{body}</svg>'
def diagram(kind,zh):
 T=lambda a,b:a if zh else b
 b=''
 if kind=='ions':
  b=text(130,45,T('离子解离','Dissociation'))+text(130,145,'NaCl',26)+arrow(205,140,300,140)+circle(385,140,28)+text(385,146,'Na⁺',22)+circle(520,140,28)+text(520,146,'Cl⁻',22)
  for cx in (385,520):
   for angle in (0,90,180,270):
    x=cx+65*math.cos(math.radians(angle));y=140+65*math.sin(math.radians(angle));b+=text(x,y,'H₂O',13)
  b+=text(425,265,T('溶剂排列示意，未表示真实水合数','Solvation schematic; no hydration number implied'),13)
 elif kind=='atomic':
  for cx,label,n in [(185,'He',2),(485,'Ne',10)]:
   b+=circle(cx,140,24)+text(cx,146,label,22)
   for r,num in ([(60,2)] if n==2 else [(45,2),(87,8)]):
    b+=circle(cx,140,r,'none','#c5d5df')
    for i in range(num):b+=circle(cx+r*math.cos(i*2*math.pi/num),140+r*math.sin(i*2*math.pi/num),5,'#2156ff','#2156ff')
  b+=text(340,270,T('电子数示意；不是电子轨道或实际轨迹','Electron-count model, not orbitals or trajectories'),13)
 elif kind=='isotope':
  for x,m,n in [(175,12,6),(340,13,7),(505,14,8)]:b+=text(x-33,100,str(m),18)+text(x-33,132,'6',18)+text(x,140,'C',44)+text(x,205,T(f'6 质子 · {n} 中子',f'6 protons · {n} neutrons'),15)
 elif kind=='polymer':
  for left,fluor,label in [(55,False,'PE'),(365,True,'PTFE')]:
   b+=text(left+110,45,label,22)
   for i,x in enumerate([left+60,left+160]):
    b+=text(x,145,'C',22)+line(x,125,x,88)+line(x,153,x,192)+text(x,78,'F' if fluor else 'H',19)+text(x,218,'F' if fluor else 'H',19)
   b+=line(left+75,138,left+145,138)+line(left+5,138,left+43,138)+line(left+177,138,left+217,138)+path(f'M {left+30} 85 L {left+20} 85 L {left+20} 224 L {left+30} 224')+path(f'M {left+190} 85 L {left+200} 85 L {left+200} 224 L {left+190} 224')+text(left+220,236,'n',17)
 elif kind=='coordination':
  for cx,cis in [(180,True),(500,False)]:
   b+=text(cx,45,T('顺式','cis') if cis else T('反式','trans'),20)+text(cx,150,'Pt',24)
   for (dx,dy),label in zip([(0,-65),(65,0),(0,65),(-65,0)],['Cl','Cl','NH₃','NH₃'] if cis else ['Cl','NH₃','Cl','NH₃']):b+=line(cx+dx*.23,143+dy*.23,cx+dx*.75,143+dy*.75)+text(cx+dx,150+dy,label,18)
  b+=text(340,270,T('PtCl₂(NH₃)₂ 的方平面连接示意','Square-planar connectivity in PtCl₂(NH₃)₂'),13)
 elif kind=='lattice':
  # Four tetrahedral neighbours versus three-connected hexagonal carbon layers.
  c=(160,145)
  for x,y in [(95,90),(225,90),(105,210),(225,210)]:b+=line(*c,x,y)+circle(x,y,9,'#e3edf3')
  b+=circle(*c,12,'#2156ff')+text(160,45,T('四连接局部环境','Four-connected environment'),16)
  for dy in (0,55):
   for cx in (425,515):
    pts=[(cx+52*math.cos(i*math.pi/3),120+dy+38*math.sin(i*math.pi/3)) for i in range(6)]
    for i in range(6):b+=line(*pts[i],*pts[(i+1)%6])
  b+=text(475,45,T('层状六角连接','Layered hexagonal connectivity'),16)+text(340,280,T('金刚石 / 石墨局部拓扑；非晶胞坐标','Diamond / graphite local topology; not unit-cell coordinates'),13)
 elif kind=='mof':
  for r in range(3):
   for col in range(4):
    x,y=170+col*110,70+r*80
    if col<3:b+=line(x,y,x+110,y)
    if r<2:b+=line(x,y,x,y+80)
    b+=circle(x,y,12,'#c9dfec')
  b+=text(340,278,T('金属节点—有机连接体；孔道拓扑示意','Metal nodes–organic linkers; pore topology schematic'),14)
 elif kind=='host':
  b+=path('M 180 70 C 90 90 90 220 180 235 L 485 235 C 580 220 580 90 485 70 Z')+path('M 220 110 C 180 120 180 185 220 195 L 440 195 C 480 185 480 120 440 110 Z')+circle(333,153,26,'#d3e2fa','#2156ff')+text(333,159,T('客体','Guest'),16)+text(340,40,T('主客体空腔','Host–guest cavity'),20)+text(340,280,T('尺寸与连接关系示意；非具体主分子的结构式','Size/topology schematic, not a specific host structure'),13)
 elif kind in ('dna','rna'):
  b+=text(340,35,T('糖—磷酸骨架与配对','Sugar–phosphate backbones and pairing'),18)
  for i,(a,c) in enumerate([('A','U' if kind=='rna' else 'T'),('G','C'),('U' if kind=='rna' else 'T','A')]):
   y=85+i*65;b+=circle(155,y,12)+circle(525,y,12)+text(155,y+5,'P',13)+text(525,y+5,'P',13)+line(170,y,240,y)+line(440,y,510,y)+text(270,y+5,a,21)+text(410,y+5,c,21)+line(295,y,385,y,dash=True)
   if i<2:b+=line(155,y+13,155,y+51)+line(525,y+13,525,y+51)
  b+=text(340,285,T('配对示意；不代表具体序列或原子结构','Pairing schematic; not a specific sequence or atomic structure'),12)
 elif kind in ('membrane','aquaporin'):
  for y in (90,210):
   for x in range(65,630,26):b+=circle(x,y,6)+line(x,y+(8 if y==90 else -8),x,y+(35 if y==90 else -35),'#b5cad7')
  for i in range(6 if kind=='aquaporin' else 7):
   x=250+i*25;b+=path(f'M{x} 60 C{x-20} 115 {x+20} 185 {x} 245','#2156ff',6)
  b+=arrow(340,30,340,70)+arrow(340,245,340,275)+text(90,155,T('膜','Membrane'),16)+text(540,155,T('通道 / 受体','Channel / receptor'),16)
 elif kind=='peptide':
  for i,(a,c) in enumerate([('H₂N','CH(R₁)'),('CO—NH','CH(R₂)'),('CO—NH','CH(R₃)')]):
   x=105+i*195;b+=text(x,130,a,20)+line(x+38,125,x+78,125)+text(x+105,130,c,17)
  b+=text(340,215,T('—CO—NH— 为肽键连接；R 表示侧链','—CO—NH— peptide linkages; R denotes side chains'),16)
 elif kind=='protein':
  b+=path('M70 175 C110 50 150 270 200 110 S290 250 330 95 S420 250 460 125 S540 220 600 95','#2156ff',6)
  for x,y in [(120,130),(240,140),(360,155),(485,165)]:b+=circle(x,y,14)
  b+=text(340,45,T('序列 → 折叠 → 作用位点','Sequence → folding → functional site'),19)+text(340,275,T('折叠关系示意，不是实验蛋白结构或坐标','Folding schematic, not experimental protein coordinates'),13)
 elif kind=='catenane':
  b+=path('M245 80 C120 80 120 230 245 230 C350 230 350 80 245 80','#2156ff',5)+path('M425 80 C300 80 300 230 425 230 C550 230 550 80 425 80','#3b687d',5)+path('M317 132 L317 179','#fff',11)+text(340,42,T('机械互锁环','Mechanically interlocked rings'),20)+text(340,280,T('拓扑示意，未指定实际分子组成','Topological schematic; no specific molecular composition'),13)
 elif kind=='ribosome':
  b+=path('M150 170 C110 45 540 40 550 170 Z','#3b687d',2,'#e3edf3')+path('M180 195 C130 280 540 280 520 195 Z','#3b687d',2,'#edf3f7')+line(80,182,600,182,'#2156ff')+text(340,130,T('大亚基','Large subunit'),19)+text(340,239,T('小亚基','Small subunit'),19)+text(90,165,'mRNA',15)+arrow(340,92,340,40)
 elif kind=='degradation':
  for x,label in [(140,T('靶蛋白','Target')),(540,T('E3 连接酶','E3 ligase'))]:b+=circle(x,140,65)+text(x,145,label,19)
  b+=path('M200 140 L260 115 L320 165 L380 115 L440 140','#2156ff',4)+text(340,80,T('双功能降解分子','Bifunctional degrader'),18)+text(340,250,T('作用关系示意，不对应特定 PROTAC 的结构式','Interaction schematic, not a specific PROTAC structure'),13)
 elif kind=='colloid':
  for i,(cx,r,n) in enumerate([(160,6,13),(350,13,7),(540,25,3)]):
   for j in range(n):b+=circle(cx+45*math.cos(j*2.4),140+65*math.sin(j*2.4),r)
  b+=text(340,45,T('粒径与分散状态','Particle size and dispersion'),20)+text(340,278,T('颗粒示意，未使用实测尺寸或分布','Illustrative particles, not measured sizes or distributions'),13)
 elif kind=='boron':
  b+=text(240,155,'B',28)+text(440,155,'B',28)
  for cx in (240,440):
   for dy in (-65,65):x=cx+(-90 if cx==240 else 90);y=145+dy;b+=line(cx+(-15 if cx==240 else 15),145+dy*.2,x+(15 if cx==240 else -15),y)+text(x,y+7,'H',24)
  for y in (75,225):b+=text(340,y,'H',24)+line(255,145,330,y+3,dash=True)+line(425,145,350,y+3,dash=True)
  b+=text(340,280,T('桥式 B—H—B：三中心两电子键示意','Bridging B—H—B: three-centre two-electron model'),13)
 elif kind=='electrode':
  b+=path('M130 70 L130 225 L550 225 L550 70','#3b687d',2)+path('M135 155 L545 155','#bdd2df',2)+path('M230 35 L230 195 M450 35 L450 195','#2156ff',8)+text(230,265,T('电极','Electrode'),18)+text(450,265,T('电极','Electrode'),18)
  for x,y,t in [(290,125,'Ox'),(370,185,'Red')]:b+=text(x,y,t,20)
  b+=arrow(300,155,390,155)+text(340,55,'e⁻',23)
 elif kind=='surface':
  for y in (170,210):
   for x in range(100,610,55):b+=circle(x,y,15)
  b+=text(340,45,T('局部位点与吸附物','Local sites and adsorbates'),20)+circle(290,117,13,'#d3e2fa','#2156ff')+circle(350,117,13,'#d3e2fa','#2156ff')+line(303,117,337,117)+line(290,130,280,155,dash=True)+line(350,130,360,155,dash=True)
 elif kind=='periodic':
  for col in range(5):
   for row in range(3):b+=circle(100+col*38,90+row*50,6)
  lengths=[24,40,24,24,40,24,40,24,24];x=360
  for i,l in enumerate(lengths):b+=path(f'M{x} 65 L{x+l} 65 L{x+l} 210 L{x} 210 Z','#3b687d',1.4,'#e3edf3' if l==24 else '#d3e2fa');x+=l
  b+=text(180,265,T('周期重复','Periodic repetition'),17)+text(500,265,T('非周期有序类比','Aperiodic-order analogy'),17)
 elif kind=='qdot':
  for x,r,color in [(165,30,'#2156ff'),(340,45,'#447baf'),(525,60,'#3b687d')]:b+=circle(x,135,r,'#e3edf3',color)+circle(x,135,r+10,'none','#b8cbd9')+text(x,235,T('尺寸示意','Illustrative size'),13)
  b+=text(340,40,T('核 / 壳与尺寸尺度','Core / shell and size scales'),20)
 elif kind in ('battery','unknown-battery'):
  for x,label in [(165,T('电极','Electrode')),(510,T('电极','Electrode'))]:b+=path(f'M{x-50} 65 L{x+50} 65 L{x+50} 230 L{x-50} 230 Z','#3b687d',2,'#e3edf3')+text(x,270,label,17)
  b+=path('M295 65 L380 65 L380 230 L295 230 Z','#2156ff',2,'#f3f6fc')+text(340,45,T('电解质 / 隔膜','Electrolyte / separator'),17)+arrow(225,140,425,140)
  for x in (250,338,410):b+=circle(x,175,13,'#fff','#2156ff')+text(x,180,'ion' if kind=='unknown-battery' else 'Li⁺',13)
 elif kind=='olivine':
  pts=[(340,60),(230,200),(450,200),(340,230)]
  for x,y in pts:b+=line(340,145,x,y)+circle(x,y,17,'#f0f4f7')+text(x,y+6,'O',18)
  b+=circle(340,145,20,'#d3e2fa','#2156ff')+text(340,152,'Si',19)
  for x in (100,580):b+=circle(x,145,29)+text(x,152,'Mg²⁺',17)
  b+=text(340,285,T('Mg₂SiO₄ 端元的组成 / 四面体示意；非晶胞坐标','Mg₂SiO₄ end-member composition / tetrahedron; not unit-cell coordinates'),12)
 elif kind=='superconductor':
  for row in range(3):
   for col in range(7):b+=circle(140+col*65,80+row*65,8)
  b+=arrow(125,145,555,145)+text(340,45,T('晶格背景与电流（概念示意）','Lattice background and current (conceptual)'),19)+text(340,278,T('未指定元素位置，不代表 LK-99 或 REBCO 晶胞','No atomic-site assignment; not an LK-99 or REBCO unit cell'),13)
 elif kind=='atpase':
  for y in (165,235):
   b+=line(70,y,610,y,'#9bb5c8')
  b+=path('M280 185 C280 155 400 155 400 185 C400 215 280 215 280 185','#2156ff',3,'#edf3f7')+text(340,210,'F₀',17)+line(340,165,340,100)
  for x,y in [(310,72),(370,72),(340,100)]:b+=circle(x,y,30,'#e3edf3')
  b+=text(340,82,'F₁',18)+arrow(435,140,435,255)+text(475,150,'H⁺',20)+text(165,80,'ADP + Pi',18)+arrow(210,92,270,92)+text(535,80,'ATP',21)+arrow(405,92,490,92)+text(340,282,T('ATP 合酶组分 / 耦联示意；非原子结构','ATP synthase components / coupling; not atomic coordinates'),12)
 elif kind=='enzyme':
  b+=path('M90 175 C70 60 250 30 300 110 L255 145 L300 185 C250 275 80 260 90 175','#3b687d',2,'#e3edf3')+circle(350,145,25,'#d3e2fa','#2156ff')+arrow(395,145,470,145)+text(535,150,T('产物','Products'),22)+text(180,155,T('活性位点','Active site'),16)
 elif kind=='energy':
  b+=arrow(80,245,610,245)+arrow(80,245,80,45)+path('M100 205 C160 205 170 65 245 65 S335 205 390 185 S450 105 490 110 S540 210 595 155','#2156ff',3)+text(340,280,T('反应坐标示意；不含计算能量值','Reaction-coordinate schematic; no computed energy values'),13)+text(50,60,'E',20)
 elif kind=='thermal':
  b+=text(175,45,T('较强热运动（示意）','Greater thermal motion (illustrative)'),16)+text(500,45,T('较弱热运动（示意）','Lower thermal motion (illustrative)'),16)
  for offset,length in [(0,32),(325,12)]:
   for i in range(7):
    x=95+(i%3)*65+offset;y=100+(i//3)*62
    b+=circle(x,y,8)+arrow(x+12,y,x+12+length,y)
  b+=text(340,285,T('箭头为教学表示，不是实测速率或量子态','Illustrative arrows, not measured velocities or quantum states'),12)
 elif kind=='convection':
  b+=path('M70 65 L610 65 L610 235 L70 235 Z')
  for x in (160,340,520):b+=path(f'M{x-45} 175 C{x-80} 80 {x+70} 65 {x+45} 150 C{x+50} 220 {x-50} 230 {x-45} 175','#2156ff',3)+arrow(x+45,143,x+45,165)
  b+=text(340,40,T('受驱动的对流胞（示意）','Driven convection cells (schematic)'),19)+text(340,280,T('热流维持有序运动；不是原子结构或实测流场','Heat-driven organized motion, not atomic structure or a measured field'),12)

 return shell(b)
# A calculated cyclohexane conformation is explicitly distinguished from experimental data.
m=Chem.AddHs(Chem.MolFromSmiles('C1CCCCC1'))
if AllChem.EmbedMolecule(m,randomSeed=20261025)!=0:raise ValueError('Conformer generation failed')
AllChem.UFFOptimizeMolecule(m)
coords=[m.GetConformer().GetAtomPosition(i) for i in range(6)]
projected=[(p.x+.35*p.z,p.y*.38-p.z*.9) for p in coords]
xs=[p[0] for p in projected];ys=[p[1] for p in projected]
scale=min(450/(max(xs)-min(xs)),150/(max(ys)-min(ys)))
xy=[(340+(x-(min(xs)+max(xs))/2)*scale,145+(y-(min(ys)+max(ys))/2)*scale) for x,y in projected]
body=''
for i in range(6):body+=line(*xy[i],*xy[(i+1)%6])
for x,y in xy:body+=circle(x,y,10,'#fff')+text(x,y+5,'C',15)
body+=text(340,275,'Cyclohexane · calculated UFF conformer (H omitted)',14)
save('chair-model',shell(body),C('环己烷的计算构象','Calculated cyclohexane conformation'),C('由连接结构生成并经 UFF 优化的教学构象，隐去氢；不是实验坐标，也未据图计算构象能量差。','A generated, UFF-optimized teaching conformer with hydrogens omitted; not experimental coordinates or a measured conformational energy difference.'),[dict(label='PubChem',url='https://pubchem.ncbi.nlm.nih.gov/compound/8078')],'computed-conformer')
# Each conceptual family has a distinct scientific schematic and a translated counterpart.
families=['ions','atomic','isotope','polymer','coordination','lattice','mof','host','dna','membrane','peptide','protein','catenane','ribosome','degradation','colloid','boron','electrode','surface','periodic','qdot','battery','unknown-battery','atpase','enzyme','energy','thermal','convection','rna','aquaporin','olivine','superconductor']
for kind in families:
 for lang in ('zh','en'):
  save(kind+'-'+lang,diagram(kind,lang=='zh'),C('结构与连接示意','Structure and connectivity schematic'),C('教学示意图：突出连接、空间层次或组分关系；不代表某个企业未公开的配方，也不是实验原子坐标。','Teaching schematic of connectivity, organization or component relationships; not proprietary chemistry or experimental atomic coordinates.'),[],'schematic')
# Every annual concept is explicitly mapped; no generic silent fallback.
mapping={
'equilibrium':['ammonia'],'chiral':['carvone-r','carvone-s'],'ions':['ions','sucrose'],'noble':['atomic'],'pigment':['indigo'],'fluorine':['sodium-fluoride','polymer'],'enzymes':['glucose','ethanol','enzyme'],'radio':['isotope'],'catalysis':['energy','surface'],'terpene':['limonene'],'organometallic':['coordination'],'coordination':['coordination','mof'],'analysis':['ethanol','dimethyl-ether'],'colloid':['colloid'],'steroid':['cholesterol'],'isotope':['isotope'],'vitamins':['ascorbic-acid'],'separation':['ethanol','dimethyl-ether'],'protein':['peptide','protein'],'cold':['thermal'],'element':['isotope'],'polymer':['polymer'],'bonding':['lattice'],'peptide':['peptide'],'kinetics':['energy'],'carbondate':['isotope'],'photosynthesis':['carbon-dioxide','glucose'],'crystal':['periodic'],'synthesis':['peptide'],'conformation':['cyclohexane','chair-model'],'quantum':['energy'],'electron':['electrode'],'dna':['dna','deoxy-amp'],'hostguest':['host'],'rna':['adenosine-monophosphate','rna'],'ribozyme':['rna','enzyme'],'nmr':['ethanol','dimethyl-ether'],'ozone':['ozone'],'fullerene':['fullerene','lattice'],'atp':['atp','atpase'],'conductive':['polymer'],'aquaporin':['aquaporin'],'ubiquitin':['degradation'],'metathesis':['octadiene','cyclohexene','ethylene'],'imaging':['protein'],'ribosome':['ribosome'],'quasicrystal':['periodic'],'gpcr':['membrane'],'repair':['dna'],'motor':['catenane'],'cryoem':['protein'],'directed':['protein','enzyme'],'battery':['battery'],'editing':['dna'],'click':['triazole'],'qdot':['qdot'],'mof':['mof'],'preservation':['glucose'],'sugardonor':['sucrose'],'boron':['boron'],'carbocation':['tert-butyl-cation'],'geneticcode':['dna','peptide'],'electroanalysis':['electrode'],'nonequilibrium':['convection'],'cycloaddition':['cyclohexene'],'nucleotide':['adenosine-monophosphate'],'surface':['surface']}
learning=json.loads((ROOT/'scripts/nobel/learning-guides.json').read_text())
missing=set(learning['concepts'])-set(mapping)
if missing:raise ValueError('Unillustrated concepts '+str(missing))
context_map={'donut':['unknown-battery'],'llzo':['battery'],'qs':['battery'],'toyota':['battery'],'phone':['battery'],'battery-commercial':['unknown-battery'],'superconductor':['superconductor'],'lk99':['superconductor'],'enzyme':['enzyme'],'olivine':['olivine']}
manifest={'schemaVersion':'1.0','generator':'scripts/scientific-figures/build.py','rdkitVersion':'2025.3.6','figures':metadata,'concepts':mapping,'contexts':context_map,'families':families}
(ROOT/'src/data/scientificStructures.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Generated',len(metadata),'SVG assets for',len(mapping),'annual concepts and',len(context_map),'market contexts; R/S and molecular formulas validated.')
