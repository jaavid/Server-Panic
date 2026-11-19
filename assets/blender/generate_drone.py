"""Drone model: independent floating torso, articulated arms, cooling jets."""
from .common import cube,sphere,cylinder,make_palette
import math

def create_drone(frame=0,mode='hover'):
    p=make_palette(0,'recovery')
    z=1.35+.095*math.sin(frame*math.tau/8)
    if mode=='repair':z-=.1
    cube('Drone chassis',(0,0,z),(1.35,.92,.79),p['white'],.38)
    cube('Face screen',(0,-.48,z+.035),(1.08,.10,.47),p['face'],.20)
    for x in (-.25,.25):sphere('Animated cyan eye',(x,-.56,z+.07),.092,p['accent'])
    sphere('Smile',(0,-.58,z-.17),.055,p['accent'])
    cylinder('Antenna',(0,0,z+.62),.075,.34,p['side'])
    sphere('Antenna light',(0,0,z+.83),.105,p['warning'])
    for x in (-1,1):
        cube('Arm segment',(x*.81,0,z-.10),(.50,.21,.18),p['side'],.08)
        sphere('Articulated wrist',(x*1.05,-.02,z-.16),.14,p['white'])
        cylinder('Cooling fan',(x*1.12,-.03,z-.17),.24,.13,p['accent'],rotation=(1.57,0,0))
        if mode=='repair':
            cube('Repair nozzle',(x*1.07,-.28,z-.36),(.12,.16,.33),p['white'],.06)
    for x in (-.36,.36):
        cylinder('Thruster',(x,.15,z-.46),.14,.15,p['accent'])
