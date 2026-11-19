"""Original modeled diorama with embedded cable routing and power unit."""
from .common import cube, sphere, cylinder, mat
import math
from mathutils import Vector
import bpy

def create_environment():
    deck=mat('Blue graphite deck',(.11,.20,.32,1),.5,.38)
    rim=mat('Cyan rim',(.055,.65,.80,1),.3,.3,1.7)
    dark=mat('Mounting graphite',(.04,.09,.16,1),.38,.42)
    amber=mat('Cable amber',(.96,.57,.16,1),.22,.37)
    purple=mat('Warning purple',(.43,.26,.82,1),.4,.38,1)
    cube('Isometric floor block',(0,0,-.25),(7.6,5.7,.48),deck,.2)
    cube('Floor luminous trim',(0,0,-.014),(7.35,5.45,.024),rim,.14)
    cube('Floor top insert',(0,0,.015),(7.21,5.31,.027),deck,.09)
    for x in [-2.35,0,2.35]:
        cube('Rack mounting slab',(x,.20,.105),(1.74,1.48,.16),dark,.10)
        for dx in [-.55,.55]:
            sphere('Mounting LED',(x+dx,-.36,.21),.042,rim,12,8)
    for i in range(6):
        cube('Service floor seam',(-3.1+i*1.15,.02,.036),(.024,4.99,.018),dark,.01)
    for i in range(4):
        cube('Cross floor seam',(0,-2+i*1.3,.036),(7.1,.018,.018),dark,.01)
    # Segmented service cable and connector units.
    points=[(-3,-1.4,-.0),(-2,-2,-.0),(0,-2.1,-.0),(2,-1.85,-.0),(3,-1.4,-.0)]
    for a,b in zip(points,points[1:]):
        delta=Vector(b)-Vector(a)
        mid=(Vector(a)+Vector(b))*.5
        wire=cylinder('Power cable',mid,.05,delta.length,amber,12)
        wire.rotation_euler=delta.to_track_quat('Z','Y').to_euler()
    cube('UPS power distribution',(3.1,1.6,.56),(.88,.75,1.1),dark,.12)
    for i in range(3):sphere('UPS status',(2.85+i*.25,1.20,.60),.055,purple,12,8)
    cube('Emergency lamp base',(-3.05,1.8,.30),(.41,.40,.56),dark,.07)
    sphere('Emergency lamp',(-3.05,1.8,.66),.20,amber)
