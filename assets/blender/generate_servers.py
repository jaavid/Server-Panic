"""Three variant server-rack characters and their expressive operational states."""
from .common import cube,sphere,cylinder,make_palette

def create_server(variant=0,state='idle'):
    p=make_palette(variant,state)
    shape_adjust=[1.0,1.09,.93][variant]
    cube('Rack body', (0,0,1.33), (1.68*shape_adjust,1.04,2.55),p['body'],.19)
    cube('Side panel accent',(0.74*shape_adjust,.03,1.4),(.12,.91,2.29),p['side'],.07)
    cube('Rim', (0,-.55,1.40),(1.45*shape_adjust,.15,2.28),p['white'],.10)
    cube('Main faceplate',(0,-.64,1.89),(1.24*shape_adjust,.07,.89),p['face'],.13)
    # Face: two eye emitters, with slanted worried eyes for critical state.
    for x in (-.28,.28):
        eye=cube('LED eye',(x,-.703,1.99),(.20,.035,.20),p['accent'],.075)
        if state=='critical': eye.rotation_euler[1]=.3 if x<0 else -.3
        elif state=='offline': eye.dimensions.z=.042
    if state=='overheating':
        cube('Worried zigzag',(0,-.71,1.63),(.39,.03,.035),p['warning'],.014)
    elif state=='offline':
        cube('Offline flat mouth',(0,-.71,1.62),(.28,.03,.035),p['vent'],.01)
    else: sphere('Smile mouth',(0,-.715,1.65),.055,p['accent'])
    # Vent array and status lights.
    cube('Lower maintenance cover',(0,-.63,.77),(1.27*shape_adjust,.09,.77),p['side'],.08)
    for row in range(4):
        cube(f'Vent {row}',(0,-.693,.51+row*.15),(1.00*shape_adjust,.03,.058),p['vent'],.02)
        cube(f'Activity bar {row}',(-.25,-.718,.51+row*.15),(.38,.018,.025),p['accent'],.01)
    for x in [-.52,-.28,-.04,.20,.44]:
        sphere('Network LED',(x,-.71,2.47),.04,p['accent'],12,8)
    for x in (-.57,.57):
        cube('Rack foot',(x,-.1,.055),(.24,.85,.15),p['vent'],.04)
    if variant==0:
        cylinder('Blue side turbine',(-.86,0,2.16),.17,.075,p['accent'],rotation=(0,1.57,0))
    elif variant==1:
        cube('Amber antenna fin',(-.24,-.05,2.70),(.35,.19,.28),p['warning'],.07)
    else:
        cube('Violet asymmetrical top fin',(.40,.15,2.69),(.25,.27,.35),p['accent'],.06)
    if state in ('overheating','critical'):
        for i in range(2):sphere('Thermal bubble',(-.24+i*.45,.06,2.89+i*.13),.07+i*.025,p['warning'])
    if state=='recovery':
        sphere('Recovery star',(0,-.75,2.45),.08,p['accent'])
